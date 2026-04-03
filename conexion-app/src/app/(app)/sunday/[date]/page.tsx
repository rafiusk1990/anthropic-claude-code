import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TopBar } from "@/components/layout/nav"
import { SundayLiveView } from "@/components/sunday/sunday-live-view"
import { formatDate } from "@/lib/utils"
import type { Profile } from "@/types/database"

interface PageProps {
  params: Promise<{ date: string }>
}

export default async function SundayPage({ params }: PageProps) {
  const { date } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || !["leader", "coordinator"].includes(profile.role)) redirect("/dashboard")

  const dateObj = new Date(date + "T12:00:00")
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1

  // Get schedule for this month
  const { data: schedule } = await supabase
    .from("schedules").select("*")
    .eq("year", year).eq("month", month).single()

  let slots: any[] = []
  let taskAssignments: any[] = []

  if (schedule) {
    const [slotsRes, taRes] = await Promise.all([
      supabase.from("schedule_slots")
        .select("*, volunteer:profiles(id,name,phone), area:areas(id,name,team:teams(name))")
        .eq("schedule_id", schedule.id)
        .eq("sunday_date", date)
        .order("service_time"),
      supabase.from("task_assignments")
        .select("*, task:special_tasks(name)")
        .eq("sunday_date", date),
    ])
    slots = slotsRes.data || []
    taskAssignments = taRes.data || []
  }

  const { data: volunteers } = await supabase
    .from("profiles").select("id,name,primary_team_id").eq("active", true).order("name")

  const { data: areas } = await supabase
    .from("areas").select("*, team:teams(name)").order("order")

  const { data: report } = await supabase
    .from("sunday_reports").select("*").eq("sunday_date", date).single()

  return (
    <div>
      <TopBar
        title="Vista del Domingo"
        subtitle={formatDate(date + "T12:00:00")}
      />
      <SundayLiveView
        date={date}
        profile={profile as Profile}
        schedule={schedule || null}
        slots={slots}
        taskAssignments={taskAssignments}
        volunteers={volunteers || []}
        areas={areas || []}
        existingReport={report || null}
      />
    </div>
  )
}
