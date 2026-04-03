"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ShieldCheck } from "lucide-react"

export default function ConsentPage() {
  const [loading, setLoading] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleAccept() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("profiles").update({ consent_accepted: true }).eq("id", user.id)
    }
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-xl">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Aviso de Privacidad</h1>
        </div>

        <div className="prose prose-sm text-gray-600 space-y-3 text-sm">
          <p>
            Bienvenido/a a la app del Equipo de Voluntarios de Iglesia Conexión.
          </p>
          <p>
            Para funcionar, esta app almacena y procesa los siguientes datos personales:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nombre completo</li>
            <li>Correo electrónico</li>
            <li>Número de teléfono (opcional)</li>
            <li>Rol y equipo de servicio</li>
            <li>Disponibilidad y asignaciones de servicio</li>
          </ul>
          <p>
            <strong>¿Para qué usamos tus datos?</strong> Exclusivamente para organizar la programación mensual de voluntarios y enviar recordatorios de servicio.
          </p>
          <p>
            <strong>¿Quién accede a tus datos?</strong> Solo los líderes y coordinadores del equipo tienen acceso a la información de todos los voluntarios. Tú solo verás tu propia escala.
          </p>
          <p>
            <strong>Tus derechos:</strong> Puedes solicitar acceso, rectificación o eliminación de tus datos en cualquier momento contactando a tu líder.
          </p>
          <p className="text-xs text-gray-400">
            De acuerdo con la Ley 21.719 de Protección de Datos Personales de Chile.
          </p>
        </div>

        <div className="mt-5 flex items-start gap-3">
          <input
            id="accept"
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <label htmlFor="accept" className="text-sm text-gray-700">
            He leído y acepto el aviso de privacidad
          </label>
        </div>

        <Button
          onClick={handleAccept}
          disabled={!accepted || loading}
          className="w-full mt-4"
          size="lg"
        >
          {loading ? "Guardando..." : "Continuar"}
        </Button>
      </div>
    </div>
  )
}
