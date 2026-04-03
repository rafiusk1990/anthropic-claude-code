import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TopBar } from "@/components/layout/nav"
import { SettingsManager } from "@/components/settings/settings-manager"

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || profile.role !== "leader") redirect("/dashboard")

  const [teamsRes, areasRes, tasksRes] = await Promise.all([
    supabase.from("teams").select("*").order("order"),
    supabase.from("areas").select("*, team:teams(name)").order("order"),
    supabase.from("special_tasks").select("*").order("order"),
  ])

  return (
    <div>
      <TopBar title="Configuración" />
      <SettingsManager
        teams={teamsRes.data || []}
        areas={areasRes.data || []}
        tasks={tasksRes.data || []}
      />
    </div>
  )
}
