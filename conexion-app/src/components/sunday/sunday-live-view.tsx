"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { Check, X, ArrowRightLeft, ClipboardList, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile, Schedule } from "@/types/database"

interface SundayLiveViewProps {
  date: string
  profile: Profile
  schedule: Schedule | null
  slots: any[]
  taskAssignments: any[]
  volunteers: any[]
  areas: any[]
  existingReport: any
}

const SERVICE_TIMES = ["10:00", "12:00"] as const

export function SundayLiveView({
  date, profile, schedule, slots: initialSlots,
  taskAssignments, volunteers, areas, existingReport,
}: SundayLiveViewProps) {
  const [slots, setSlots] = useState(initialSlots)
  const [moveModal, setMoveModal] = useState<{ slot: any } | null>(null)
  const [activeTab, setActiveTab] = useState<"10:00" | "12:00" | "tasks" | "report">("10:00")
  const { toast } = useToast()
  const supabase = createClient()

  async function togglePresence(slot: any) {
    const newVal = slot.confirmed_present === true ? false : slot.confirmed_present === false ? null : true
    const { error } = await supabase
      .from("schedule_slots")
      .update({ confirmed_present: newVal })
      .eq("id", slot.id)
    if (!error) {
      setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, confirmed_present: newVal } : s))
    }
  }

  async function moveVolunteer(slot: any, newAreaId: string) {
    const { error } = await supabase
      .from("schedule_slots")
      .update({ area_id: newAreaId })
      .eq("id", slot.id)
    if (!error) {
      const newArea = areas.find(a => a.id === newAreaId)
      setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, area_id: newAreaId, area: newArea } : s))
      setMoveModal(null)
      toast("Voluntario movido", "success")
    }
  }

  const slotsByTime = (time: string) => slots.filter(s => s.service_time === time)

  const areaGroups = (time: string) => {
    const timeSlots = slotsByTime(time)
    const grouped: Record<string, { area: any; slots: any[] }> = {}
    for (const slot of timeSlots) {
      const key = slot.area?.id || slot.area_id
      if (!grouped[key]) grouped[key] = { area: slot.area, slots: [] }
      grouped[key].slots.push(slot)
    }
    return Object.values(grouped)
  }

  const presentCount = (time: string) => slotsByTime(time).filter(s => s.confirmed_present === true).length
  const totalCount = (time: string) => slotsByTime(time).length

  if (!schedule) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No hay programación para este domingo.</p>
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Tab bar */}
      <div className="flex border-b bg-white sticky top-0 z-10 overflow-x-auto">
        {(["10:00", "12:00", "tasks", "report"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 min-w-[70px] py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab
                ? "border-black text-black"
                : "border-transparent text-gray-500"
            )}
          >
            {tab === "tasks" ? "Tareas" : tab === "report" ? "Informe" : tab}
          </button>
        ))}
      </div>

      {/* Service views */}
      {(activeTab === "10:00" || activeTab === "12:00") && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Presentes: <strong>{presentCount(activeTab)}/{totalCount(activeTab)}</strong>
            </span>
            <Badge variant="outline">{activeTab}</Badge>
          </div>

          {areaGroups(activeTab).map(({ area, slots: areaSlots }) => (
            <Card key={area?.id || "unknown"}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="text-xs text-gray-500">{area?.team?.name}</span>
                  <span>{area?.name || "Área"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {areaSlots.map(slot => (
                  <div key={slot.id} className="flex items-center gap-3 py-1">
                    {/* Presence toggle */}
                    <button
                      onClick={() => togglePresence(slot)}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        slot.confirmed_present === true && "bg-green-500 text-white",
                        slot.confirmed_present === false && "bg-red-100 text-red-600",
                        slot.confirmed_present === null && "bg-gray-100 text-gray-400"
                      )}
                    >
                      {slot.confirmed_present === true && <Check className="h-4 w-4" />}
                      {slot.confirmed_present === false && <X className="h-4 w-4" />}
                      {slot.confirmed_present === null && <span className="text-xs font-bold">?</span>}
                    </button>

                    <span className={cn(
                      "flex-1 text-sm",
                      slot.confirmed_present === false && "line-through text-gray-400"
                    )}>
                      {slot.volunteer?.name}
                    </span>

                    {/* Move button */}
                    <button
                      onClick={() => setMoveModal({ slot })}
                      className="p-1.5 text-gray-400 hover:text-gray-700"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {areaGroups(activeTab).length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">No hay voluntarios asignados para las {activeTab}</p>
          )}
        </div>
      )}

      {/* Tasks tab */}
      {activeTab === "tasks" && (
        <div className="p-4 space-y-3">
          {taskAssignments.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">No hay tareas especiales asignadas para este domingo.</p>
          )}
          {taskAssignments.map(ta => {
            const names = (ta.volunteer_ids || [])
              .map((id: string) => volunteers.find(v => v.id === id)?.name)
              .filter(Boolean)
            return (
              <Card key={ta.id}>
                <CardContent className="p-4">
                  <p className="text-sm font-semibold">{ta.task?.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{names.join(", ") || "Sin asignar"}</p>
                  {ta.notes && <p className="text-xs text-gray-400 mt-1">{ta.notes}</p>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Report tab */}
      {activeTab === "report" && (
        <ReportForm
          date={date}
          profile={profile}
          existingReport={existingReport}
          slots10={slotsByTime("10:00")}
          slots12={slotsByTime("12:00")}
        />
      )}

      {/* Move modal */}
      {moveModal && (
        <Dialog open onOpenChange={() => setMoveModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mover voluntario</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 mb-3">
              Mover a <strong>{moveModal.slot.volunteer?.name}</strong> a:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {areas
                .filter(a => a.id !== (moveModal.slot.area?.id || moveModal.slot.area_id))
                .map(area => (
                  <button
                    key={area.id}
                    onClick={() => moveVolunteer(moveModal.slot, area.id)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 text-sm"
                  >
                    <span className="text-gray-500 text-xs">{area.team?.name} · </span>
                    {area.name}
                  </button>
                ))}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setMoveModal(null)}>Cancelar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function ReportForm({ date, profile, existingReport, slots10, slots12 }: {
  date: string
  profile: Profile
  existingReport: any
  slots10: any[]
  slots12: any[]
}) {
  const [form, setForm] = useState({
    volunteers_10am: existingReport?.volunteers_10am ?? slots10.filter(s => s.confirmed_present === true).length,
    volunteers_12pm: existingReport?.volunteers_12pm ?? slots12.filter(s => s.confirmed_present === true).length,
    leaders_10am: existingReport?.leaders_10am ?? 0,
    leaders_12pm: existingReport?.leaders_12pm ?? 0,
    visitors_10am: existingReport?.visitors_10am ?? 0,
    visitors_12pm: existingReport?.visitors_12pm ?? 0,
    salvation_10am: existingReport?.salvation_10am ?? 0,
    salvation_12pm: existingReport?.salvation_12pm ?? 0,
    notes: existingReport?.notes ?? "",
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  function field(key: keyof typeof form) {
    return {
      value: form[key] as any,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [key]: key === "notes" ? e.target.value : Number(e.target.value) })),
    }
  }

  async function handleSave() {
    setLoading(true)
    const payload = { ...form, sunday_date: date, submitted_by: profile.id, submitted_at: new Date().toISOString() }
    const { error } = await supabase.from("sunday_reports").upsert(payload, { onConflict: "sunday_date" })
    if (error) {
      toast("Error al guardar informe", "error")
    } else {
      setSaved(true)
      toast("Informe guardado", "success")
    }
    setLoading(false)
  }

  function generateShareText() {
    const totalV = form.volunteers_10am + form.volunteers_12pm
    const totalL = form.leaders_10am + form.leaders_12pm
    const totalVis = form.visitors_10am + form.visitors_12pm
    const totalSal = form.salvation_10am + form.salvation_12pm
    const text = `*Informe Domingo ${date}*\n\n*10:00 AM*\nVoluntarios: ${form.volunteers_10am} | Líderes: ${form.leaders_10am}\nVisitantes: ${form.visitors_10am} | Nuevos comienzos: ${form.salvation_10am}\n\n*12:00 PM*\nVoluntarios: ${form.volunteers_12pm} | Líderes: ${form.leaders_12pm}\nVisitantes: ${form.visitors_12pm} | Nuevos comienzos: ${form.salvation_12pm}\n\n*TOTALES*\nVoluntarios: ${totalV} | Líderes: ${totalL}\nVisitantes: ${totalVis} | Nuevos comienzos: ${totalSal}${form.notes ? `\n\n_${form.notes}_` : ""}\n\n_Equipo Conexión — The Life Church Santiago_`
    navigator.clipboard.writeText(text)
    toast("Texto copiado al portapapeles", "success")
  }

  const rows = [
    { label: "Voluntarios presentes", key10: "volunteers_10am", key12: "volunteers_12pm" },
    { label: "Líderes", key10: "leaders_10am", key12: "leaders_12pm" },
    { label: "Visitantes", key10: "visitors_10am", key12: "visitors_12pm" },
    { label: "Oración nuevo comienzo", key10: "salvation_10am", key12: "salvation_12pm" },
  ] as const

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-500 mb-1">
        <span></span>
        <span className="text-center">10:00</span>
        <span className="text-center">12:00</span>
      </div>
      {rows.map(row => (
        <div key={row.label} className="grid grid-cols-3 gap-2 items-center">
          <span className="text-sm text-gray-700">{row.label}</span>
          <input type="number" min={0} {...field(row.key10)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-center text-sm w-full" />
          <input type="number" min={0} {...field(row.key12)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-center text-sm w-full" />
        </div>
      ))}
      <textarea
        placeholder="Notas adicionales..."
        {...field("notes")}
        rows={2}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
      />
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={loading} className="flex-1">
          {loading ? "Guardando..." : saved ? "Guardado ✓" : "Guardar informe"}
        </Button>
        <Button variant="outline" onClick={generateShareText}>
          Compartir
        </Button>
      </div>
    </div>
  )
}
