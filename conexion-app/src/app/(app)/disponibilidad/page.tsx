import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TopBar } from "@/components/layout/nav"
import { AvailabilityEntry } from "@/components/availability/availability-entry"
import { getSundaysOfMonth, toISODate } from "@/lib/utils"

export default async function DisponibilidadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || !["leader", "coordinator"].includes(profile.role)) redirect("/dashboard")

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const sundays = getSundaysOfMonth(year, month).map(toISODate)

  const { data: volunteers } = await supabase
    .from("profiles").select("id, name, primary_team_id, team:teams(name)").eq("active", true).order("name")

  const { data: availability } = await supabase
    .from("availability")
    .select("*")
    .in("sunday_date", sundays)

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

  return (
    <div>
      <TopBar title="Disponibilidad" subtitle={`${monthNames[month - 1]} ${year}`} />
      <AvailabilityEntry
        year={year}
        month={month}
        sundays={sundays}
        volunteers={volunteers || []}
        availability={availability || []}
      />
    </div>
  )
}
