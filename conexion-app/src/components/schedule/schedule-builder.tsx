"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getSundaysOfMonth, toISODate, formatShortDate } from "@/lib/utils"
import { autoAssign } from "@/lib/scheduling/auto-assign"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { Wand2, Globe, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import type { Profile, Team, Area, Schedule, Availability, SpecialTask, TaskAssignment } from "@/types/database"

interface ScheduleBuilderProps {
  year: number
  month: number
  profile: Profile
  teams: Team[]
  areas: Area[]
  volunteers: Profile[]
  schedule: Schedule | null
  availability: Availability[]
  slots: any[]
  tasks: SpecialTask[]
  taskAssignments: TaskAssignment[]
}

type SlotMap = Record<string, Record<string, Record<string, string>>> // sunday -> time -> area_id -> volunteer_id

function buildSlotMap(slots: any[]): SlotMap {
  const map: SlotMap = {}
  for (const s of slots) {
    if (!map[s.sunday_date]) map[s.sunday_date] = {}
    if (!map[s.sunday_date][s.service_time]) map[s.sunday_date][s.service_time] = {}
    map[s.sunday_date][s.service_time][s.area_id] = s.volunteer_id
  }
  return map
}

const SERVICE_TIMES = ["10:00", "12:00"] as const

export function ScheduleBuilder({
  year, month, profile, teams, areas, volunteers,
  schedule, availability, slots: initialSlots, tasks, taskAssignments: initialTaskAssignments,
}: ScheduleBuilderProps) {
  const sundays = getSundaysOfMonth(year, month)
  const [slotMap, setSlotMap] = useState<SlotMap>(buildSlotMap(initialSlots))
  const [taskMap, setTaskMap] = useState<Record<string, Record<string, string[]>>>(
    initialTaskAssignments.reduce((acc, ta) => {
      if (!acc[ta.sunday_date]) acc[ta.sunday_date] = {}
      acc[ta.sunday_date][ta.task_id] = ta.volunteer_ids
      return acc
    }, {} as Record<string, Record<string, string[]>>)
  )
  const [scheduleData, setScheduleData] = useState(schedule)
  const [expandedSunday, setExpandedSunday] = useState<string | null>(sundays[0] ? toISODate(sundays[0]) : null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const isLeader = profile.role === "leader"

  async function ensureSchedule() {
    if (scheduleData) return scheduleData
    const { data, error } = await supabase
      .from("schedules")
      .insert({ year, month, status: "draft", created_by: profile.id })
      .select()
      .single()
    if (error) throw error
    setScheduleData(data)
    return data
  }

  async function handleAutoAssign() {
    startTransition(async () => {
      try {
        const sched = await ensureSchedule()
        const suggested = autoAssign({
          sundays: sundays.map(toISODate),
          volunteers,
          areas,
          availability,
          scheduleId: sched.id,
        })

        // Delete existing slots and insert new ones
        await supabase.from("schedule_slots").delete().eq("schedule_id", sched.id)
        if (suggested.length > 0) {
          await supabase.from("schedule_slots").insert(suggested)
        }

        // Rebuild slot map
        const newMap = buildSlotMap(
          suggested.map(s => ({ ...s, volunteer_id: s.volunteer_id, area_id: s.area_id }))
        )
        setSlotMap(newMap)
        toast("Sugerencia generada. Revisa y ajusta.", "success")
        router.refresh()
      } catch {
        toast("Error al generar sugerencia", "error")
      }
    })
  }

  async function handleSlotChange(sunday: string, time: string, areaId: string, volunteerId: string) {
    try {
      const sched = await ensureSchedule()

      const prev = slotMap[sunday]?.[time]?.[areaId]

      // Delete old slot for this sunday+time+area
      await supabase.from("schedule_slots")
        .delete()
        .eq("schedule_id", sched.id)
        .eq("sunday_date", sunday)
        .eq("service_time", time)
        .eq("area_id", areaId)

      if (volunteerId) {
        await supabase.from("schedule_slots").insert({
          schedule_id: sched.id,
          sunday_date: sunday,
          service_time: time,
          volunteer_id: volunteerId,
          area_id: areaId,
          confirmed_present: null,
        })
      }

      setSlotMap(prev => {
        const next = { ...prev }
        if (!next[sunday]) next[sunday] = {}
        if (!next[sunday][time]) next[sunday][time] = {}
        if (volunteerId) {
          next[sunday][time][areaId] = volunteerId
        } else {
          delete next[sunday][time][areaId]
        }
        return next
      })
    } catch {
      toast("Error al guardar cambio", "error")
    }
  }

  async function handleTaskChange(sunday: string, taskId: string, volunteerIds: string[]) {
    try {
      await supabase.from("task_assignments")
        .upsert({ sunday_date: sunday, task_id: taskId, volunteer_ids: volunteerIds, notes: null },
          { onConflict: "sunday_date,task_id" })

      setTaskMap(prev => {
        const next = { ...prev }
        if (!next[sunday]) next[sunday] = {}
        next[sunday][taskId] = volunteerIds
        return next
      })
    } catch {
      toast("Error al guardar tarea", "error")
    }
  }

  async function handlePublish() {
    if (!scheduleData) return
    startTransition(async () => {
      const { error } = await supabase
        .from("schedules")
        .update({ status: "published" })
        .eq("id", scheduleData.id)
      if (error) {
        toast("Error al publicar", "error")
      } else {
        setScheduleData({ ...scheduleData, status: "published" })
        toast("Programación publicada. Los voluntarios recibirán notificación.", "success")
      }
    })
  }

  const volunteersByTeam = teams.map(team => ({
    team,
    volunteers: volunteers.filter(v => v.primary_team_id === team.id),
  }))

  return (
    <div className="p-4 space-y-4">
      {/* Header actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {isLeader && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoAssign}
            disabled={isPending}
            className="flex items-center gap-1"
          >
            <Wand2 className="h-4 w-4" />
            Generar sugerencia
          </Button>
        )}
        {isLeader && scheduleData?.status === "draft" && (
          <Button size="sm" onClick={handlePublish} disabled={isPending} className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            Publicar programación
          </Button>
        )}
        {scheduleData?.status === "published" && (
          <Badge variant="success">Publicada</Badge>
        )}
        {scheduleData?.status === "draft" && (
          <Badge variant="warning">Borrador</Badge>
        )}
        {!scheduleData && (
          <Badge variant="secondary">Sin programación</Badge>
        )}
      </div>

      {/* Sundays */}
      {sundays.map(sunday => {
        const dateStr = toISODate(sunday)
        const isExpanded = expandedSunday === dateStr
        return (
          <Card key={dateStr}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => setExpandedSunday(isExpanded ? null : dateStr)}
            >
              <CardTitle className="flex items-center justify-between">
                <span>Domingo {formatShortDate(sunday)}</span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-4">
                {SERVICE_TIMES.map(time => (
                  <div key={time}>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{time}</span>
                    </h4>
                    <div className="space-y-2">
                      {areas.map(area => {
                        const assignedId = slotMap[dateStr]?.[time]?.[area.id] || ""
                        const team = teams.find(t => t.id === area.team_id)
                        return (
                          <div key={area.id} className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-xs text-gray-500">{team?.name} · </span>
                              <span className="text-sm font-medium">{area.name}</span>
                            </div>
                            <select
                              value={assignedId}
                              onChange={e => handleSlotChange(dateStr, time, area.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white max-w-[160px]"
                              disabled={!isLeader && profile.role !== "coordinator"}
                            >
                              <option value="">— Sin asignar —</option>
                              {volunteersByTeam
                                .find(g => g.team.id === area.team_id)
                                ?.volunteers.map(v => (
                                  <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* Special tasks */}
                {tasks.length > 0 && (
                  <div className="pt-2 border-t">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Tareas especiales</h4>
                    <div className="space-y-2">
                      {tasks.map(task => {
                        const assigned = taskMap[dateStr]?.[task.id] || []
                        return (
                          <div key={task.id}>
                            <p className="text-xs text-gray-500 mb-1">{task.name}</p>
                            <select
                              multiple
                              value={assigned}
                              onChange={e => {
                                const selected = Array.from(e.target.selectedOptions, o => o.value)
                                handleTaskChange(dateStr, task.id, selected)
                              }}
                              className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white w-full"
                              disabled={!isLeader}
                              size={Math.min(4, volunteers.length)}
                            >
                              {volunteers.map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                              ))}
                            </select>
                            {assigned.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                {assigned.map(id => volunteers.find(v => v.id === id)?.name).filter(Boolean).join(", ")}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
