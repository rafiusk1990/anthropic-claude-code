"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, Calendar, Clock } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { formatShortDate } from "@/lib/utils"
import type { Profile } from "@/types/database"

interface MiEscalaViewProps {
  profile: Profile
  slots: any[]
  hasPushSubscription: boolean
}

export function MiEscalaView({ profile, slots, hasPushSubscription: initialHasSub }: MiEscalaViewProps) {
  const [hasSub, setHasSub] = useState(initialHasSub)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  async function handleToggleNotifications() {
    setLoading(true)
    try {
      if (hasSub) {
        // Unsubscribe
        const { data: { user } } = await supabase.auth.getUser()
        if (user) await supabase.from("push_subscriptions").delete().eq("user_id", user.id)
        setHasSub(false)
        toast("Notificaciones desactivadas", "info")
      } else {
        // Request permission and subscribe
        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
          toast("Por favor, permite las notificaciones en tu navegador", "error")
          setLoading(false)
          return
        }

        const reg = await navigator.serviceWorker.ready
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) {
          toast("Notificaciones no configuradas aún", "error")
          setLoading(false)
          return
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })

        const subJson = sub.toJSON() as any
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
          }),
        })
        if (res.ok) {
          setHasSub(true)
          toast("Notificaciones activadas. Te avisaremos el sábado antes de cada servicio.", "success")
        }
      }
    } catch (e: any) {
      toast("Error al gestionar notificaciones", "error")
    }
    setLoading(false)
  }

  const grouped = slots.reduce((acc: Record<string, any[]>, slot) => {
    const key = slot.sunday_date
    if (!acc[key]) acc[key] = []
    acc[key].push(slot)
    return acc
  }, {})

  return (
    <div className="p-4 space-y-4">
      {/* Notification toggle */}
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`p-2 rounded-xl ${hasSub ? "bg-green-100" : "bg-gray-100"}`}>
            {hasSub ? <Bell className="h-5 w-5 text-green-600" /> : <BellOff className="h-5 w-5 text-gray-500" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{hasSub ? "Recordatorios activados" : "Activar recordatorios"}</p>
            <p className="text-xs text-gray-500">
              {hasSub ? "Recibirás aviso el sábado antes de servir." : "Te avisamos el día anterior a cada servicio."}
            </p>
          </div>
          <Button
            size="sm"
            variant={hasSub ? "outline" : "default"}
            onClick={handleToggleNotifications}
            disabled={loading}
          >
            {hasSub ? "Desactivar" : "Activar"}
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming slots */}
      <h2 className="text-sm font-semibold text-gray-700">Próximos servicios</h2>

      {Object.keys(grouped).length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-400 text-sm">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No tienes servicios asignados próximamente.
          </CardContent>
        </Card>
      )}

      {Object.entries(grouped).map(([date, dateSlots]) => (
        <Card key={date}>
          <CardContent className="p-4 space-y-2">
            <p className="font-semibold text-sm">{formatShortDate(date + "T12:00:00")}</p>
            {(dateSlots as any[]).map((slot, i) => (
              <div key={i} className="flex items-center gap-2 py-1 border-b last:border-0">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-sm">{slot.service_time}</span>
                <span className="text-sm text-gray-700">{slot.area?.name}</span>
                <Badge variant="secondary" className="ml-auto text-[10px]">{slot.area?.team?.name}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray.buffer as ArrayBuffer
}
