import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TopBar } from "@/components/layout/nav"
import { MiEscalaView } from "@/components/mi-escala/mi-escala-view"
import type { Profile } from "@/types/database"

export default async function MiEscalaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*, team:teams(name)").eq("id", user.id).single()
  if (!profile) redirect("/login")

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const today = now.toISOString().split("T")[0]

  // Get current month schedule
  const { data: schedule } = await supabase
    .from("schedules").select("*")
    .eq("year", year).eq("month", month)
    .eq("status", "published")
    .single()

  let mySlots: any[] = []
  if (schedule) {
    const { data } = await supabase
      .from("schedule_slots")
      .select("*, area:areas(name, team:teams(name))")
      .eq("schedule_id", schedule.id)
      .eq("volunteer_id", user.id)
      .gte("sunday_date", today)
      .order("sunday_date")
      .order("service_time")
    mySlots = data || []
  }

  // Push subscription status
  const { data: pushSub } = await supabase
    .from("push_subscriptions").select("id").eq("user_id", user.id).single()

  return (
    <div>
      <TopBar title="Mi Escala" subtitle={(profile as any).team?.name || "Voluntario/a"} />
      <MiEscalaView
        profile={profile as Profile}
        slots={mySlots}
        hasPushSubscription={!!pushSub}
      />
    </div>
  )
}
