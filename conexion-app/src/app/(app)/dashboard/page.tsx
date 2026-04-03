import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TopBar } from "@/components/layout/nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, ArrowRight } from "lucide-react"
import Link from "next/link"
import { formatShortDate, getSundaysOfMonth, toISODate } from "@/lib/utils"
import type { Profile, ScheduleSlot } from "@/types/database"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*, teams(name)").eq("id", user.id).single()
  if (!profile) redirect("/login")

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1

  // Find next Sunday
  const sundays = getSundaysOfMonth(year, month)
  const upcomingSundays = sundays.filter(s => s >= today)
  const nextSunday = upcomingSundays[0]

  // Get current month schedule
  const { data: schedule } = await supabase
    .from("schedules")
    .select("*")
    .eq("year", year)
    .eq("month", month)
    .single()

  let mySlots: ScheduleSlot[] = []
  let nextSundaySlots: ScheduleSlot[] = []

  if (schedule) {
    // My assignments this month
    if (profile.role === "volunteer") {
      const { data } = await supabase
        .from("schedule_slots")
        .select("*, area:areas(*, team:teams(*))")
        .eq("schedule_id", schedule.id)
        .eq("volunteer_id", user.id)
        .order("sunday_date")
        .order("service_time")
      mySlots = (data as ScheduleSlot[]) || []
    }

    // Next Sunday assignments (for leaders/coordinators)
    if (nextSunday && (profile.role === "leader" || profile.role === "coordinator")) {
      const { data } = await supabase
        .from("schedule_slots")
        .select("*, volunteer:profiles(name), area:areas(name, team:teams(name))")
        .eq("schedule_id", schedule.id)
        .eq("sunday_date", toISODate(nextSunday))
        .order("service_time")
        .order("area_id")
      nextSundaySlots = (data as ScheduleSlot[]) || []
    }
  }

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

  return (
    <div>
      <TopBar
        title={`¡Hola, ${profile.name.split(" ")[0]}!`}
        subtitle={`${monthNames[month - 1]} ${year}`}
      />

      <div className="p-4 space-y-4">
        {/* Role badge */}
        <div className="flex items-center gap-2">
          <Badge variant={profile.role === "leader" ? "default" : profile.role === "coordinator" ? "success" : "secondary"}>
            {profile.role === "leader" ? "Líder" : profile.role === "coordinator" ? "Coordinador/a" : "Voluntario/a"}
          </Badge>
          {(profile as any).teams && (
            <Badge variant="outline">{(profile as any).teams.name}</Badge>
          )}
        </div>

        {/* Next Sunday card */}
        {nextSunday && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Próximo domingo — {formatShortDate(nextSunday)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!schedule && (
                <p className="text-sm text-gray-500">
                  {profile.role === "leader"
                    ? "Aún no has creado la programación de este mes."
                    : "La programación aún no está disponible."}
                </p>
              )}

              {/* Volunteer: show my slots for next Sunday */}
              {profile.role === "volunteer" && mySlots.filter(s => s.sunday_date === toISODate(nextSunday)).length === 0 && schedule && (
                <p className="text-sm text-gray-500">No estás asignado/a este domingo.</p>
              )}
              {profile.role === "volunteer" && mySlots.filter(s => s.sunday_date === toISODate(nextSunday)).map(slot => (
                <div key={slot.id} className="flex items-center gap-2 py-1.5 border-b last:border-0">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{slot.service_time}</span>
                  <span className="text-sm text-gray-600">{(slot.area as any)?.name}</span>
                  <Badge variant="secondary" className="ml-auto">{(slot.area as any)?.team?.name}</Badge>
                </div>
              ))}

              {/* Leader/Coordinator: show summary */}
              {(profile.role === "leader" || profile.role === "coordinator") && nextSundaySlots.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {nextSundaySlots.length} voluntarios asignados</span>
                  </div>
                  <Link href={`/sunday/${toISODate(nextSunday)}`} className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                    Ver vista del domingo <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* My schedule this month (volunteer view) */}
        {profile.role === "volunteer" && mySlots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mis servicios este mes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mySlots.map(slot => (
                <div key={slot.id} className="flex items-center gap-2 py-1.5 border-b last:border-0">
                  <div className="text-sm font-medium w-16 shrink-0">{formatShortDate(slot.sunday_date)}</div>
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-sm">{slot.service_time}</span>
                  <span className="text-sm text-gray-600">{(slot.area as any)?.name}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick actions for leaders */}
        {(profile.role === "leader" || profile.role === "coordinator") && (
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/schedule/${year}/${month}`}>
              <Card className="h-full">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium">Programación del mes</span>
                </CardContent>
              </Card>
            </Link>
            {nextSunday && (
              <Link href={`/sunday/${toISODate(nextSunday)}`}>
                <Card className="h-full">
                  <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                    <Users className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium">Vista del domingo</span>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
