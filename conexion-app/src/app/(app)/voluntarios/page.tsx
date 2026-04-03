import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TopBar } from "@/components/layout/nav"
import { VolunteerManager } from "@/components/volunteers/volunteer-manager"
import type { Profile } from "@/types/database"

export default async function VoluntariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || profile.role !== "leader") redirect("/dashboard")

  const [volunteersRes, teamsRes] = await Promise.all([
    supabase.from("profiles").select("*, team:teams(name)").order("name"),
    supabase.from("teams").select("*").order("order"),
  ])

  return (
    <div>
      <TopBar title="Voluntarios" subtitle={`${(volunteersRes.data || []).filter(v => v.active).length} activos`} />
      <VolunteerManager
        volunteers={volunteersRes.data || []}
        teams={teamsRes.data || []}
        currentUserId={user.id}
      />
    </div>
  )
}
