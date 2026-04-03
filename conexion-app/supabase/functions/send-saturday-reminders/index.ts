import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Deno-compatible web-push using VAPID
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Get tomorrow's date (Sunday)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split("T")[0]

  // Get all slots for tomorrow
  const { data: slots, error } = await supabase
    .from("schedule_slots")
    .select("volunteer_id, service_time, area:areas(name)")
    .eq("sunday_date", tomorrowStr)

  if (error || !slots?.length) {
    return new Response(JSON.stringify({ message: "No slots for tomorrow or error", error }), { status: 200 })
  }

  // Group by volunteer
  const byVolunteer = new Map<string, any[]>()
  for (const slot of slots) {
    if (!byVolunteer.has(slot.volunteer_id)) byVolunteer.set(slot.volunteer_id, [])
    byVolunteer.get(slot.volunteer_id)!.push(slot)
  }

  // Get push subscriptions for these volunteers
  const volunteerIds = Array.from(byVolunteer.keys())
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .in("user_id", volunteerIds)

  if (!subscriptions?.length) {
    return new Response(JSON.stringify({ message: "No push subscriptions found" }), { status: 200 })
  }

  // Get volunteer names
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", volunteerIds)

  const nameMap = new Map(profiles?.map(p => [p.id, p.name]) || [])

  let sent = 0
  let failed = 0

  for (const sub of subscriptions) {
    const slots = byVolunteer.get(sub.user_id) || []
    const name = nameMap.get(sub.user_id)?.split(" ")[0] || "Voluntario"
    const servicesText = slots
      .map(s => `${s.service_time} en ${s.area?.name}`)
      .join(" y ")

    const payload = JSON.stringify({
      title: "¡Mañana sirves! 🙌",
      body: `Hola ${name}, mañana te esperamos: ${servicesText}. ¡Gracias por servir!`,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: `service-reminder-${tomorrowStr}`,
    })

    try {
      // Note: Full VAPID implementation requires crypto operations
      // In production, use a Deno web-push library or the @negrel/webpush package
      const response = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "TTL": "86400",
          // VAPID headers would go here in full implementation
        },
        body: payload,
      })
      if (response.ok) sent++
      else failed++
    } catch {
      failed++
    }
  }

  return new Response(
    JSON.stringify({ message: `Sent: ${sent}, Failed: ${failed}`, date: tomorrowStr }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  )
})
