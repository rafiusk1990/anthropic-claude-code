import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BottomNav } from "@/components/layout/nav"
import type { Profile } from "@/types/database"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  // First login: must accept consent
  if (!profile.consent_accepted) redirect("/consent")

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {children}
      <BottomNav profile={profile as Profile} />
    </div>
  )
}
