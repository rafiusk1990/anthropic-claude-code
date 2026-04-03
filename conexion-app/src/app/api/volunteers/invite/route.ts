import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Verify caller is a leader
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "leader") return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const { name, email, phone, role, primary_team_id } = await req.json()
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 })
  }

  // Use service role client for admin operations
  const { createClient: createAdminClient } = await import("@supabase/supabase-js")
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Invite user via Supabase Auth
  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { name, role, primary_team_id },
  })

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 })
  }

  // Create profile
  const { data: newProfile, error: profileError } = await adminClient
    .from("profiles")
    .insert({
      id: inviteData.user.id,
      name: name.trim(),
      phone: phone?.trim() || null,
      role: role || "volunteer",
      primary_team_id: primary_team_id || null,
      active: true,
      consent_accepted: false,
    })
    .select()
    .single()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ profile: newProfile })
}
