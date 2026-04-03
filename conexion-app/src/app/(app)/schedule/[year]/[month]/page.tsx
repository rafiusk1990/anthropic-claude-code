import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TopBar } from "@/components/layout/nav"
import { ScheduleBuilder } from "@/components/schedule/schedule-builder"
import type { Profile } from "@/types/database"

interface PageProps {
  params: Promise<{ year: string; month: string }>
}

export default async function SchedulePage({ params }: PageProps) {
  const { year: yearStr, month: monthStr } = await params
  const year = parseInt(yearStr)
  const month = parseInt(monthStr)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || !["leader", "coordinator"].includes(profile.role)) redirect("/dashboard")

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

  // Fetch all data needed for schedule builder
  const [teamsRes, areasRes, volunteersRes, scheduleRes, availRes, tasksRes] = await Promise.all([
    supabase.from("teams").select("*").order("order"),
    supabase.from("areas").select("*, team:teams(*)").order("order"),
    supabase.from("profiles").select("*, team:teams(name)").eq("active", true).order("name"),
    supabase.from("schedules").select("*").eq("year", year).eq("month", month).single(),
    supabase.from("availability").select("*").gte("sunday_date", `${year}-${String(month).padStart(2,"0")}-01`).lte("sunday_date", `${year}-${String(month).padStart(2,"0")}-31`),
    supabase.from("special_tasks").select("*").eq("active", true).order("order"),
  ])

  let slots: any[] = []
  let taskAssignments: any[] = []

  if (scheduleRes.data) {
    const [slotsRes, taRes] = await Promise.all([
      supabase.from("schedule_slots").select("*, volunteer:profiles(id,name), area:areas(id,name,team_id)").eq("schedule_id", scheduleRes.data.id),
      supabase.from("task_assignments").select("*").gte("sunday_date", `${year}-${String(month).padStart(2,"0")}-01`).lte("sunday_date", `${year}-${String(month).padStart(2,"0")}-31`),
    ])
    slots = slotsRes.data || []
    taskAssignments = taRes.data || []
  }

  return (
    <div>
      <TopBar
        title={`Programación ${monthNames[month - 1]}`}
        subtitle={`${year}`}
      />
      <ScheduleBuilder
        year={year}
        month={month}
        profile={profile as Profile}
        teams={teamsRes.data || []}
        areas={areasRes.data || []}
        volunteers={volunteersRes.data || []}
        schedule={scheduleRes.data || null}
        availability={availRes.data || []}
        slots={slots}
        tasks={tasksRes.data || []}
        taskAssignments={taskAssignments}
      />
    </div>
  )
}
