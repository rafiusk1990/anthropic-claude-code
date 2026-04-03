"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast"
import { Mail } from "lucide-react"
import { LifeChurchLogo } from "@/components/ui/life-church-logo"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [mode, setMode] = useState<"password" | "magic">("password")
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast(error.message === "Invalid login credentials" ? "Email o contraseña incorrectos" : error.message, "error")
    } else {
      router.push("/dashboard")
      router.refresh()
    }
    setLoading(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
    if (error) {
      toast("No encontramos ese email. Habla con tu líder.", "error")
    } else {
      setMagicSent(true)
    }
    setLoading(false)
  }

  if (magicSent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center">
          <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Revisa tu email</h2>
          <p className="text-gray-500 text-sm">
            Enviamos un enlace de acceso a <strong>{email}</strong>. Haz clic en el enlace para ingresar.
          </p>
          <Button variant="ghost" className="mt-4" onClick={() => setMagicSent(false)}>
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-2xl mb-4">
            <LifeChurchLogo variant="white" size="sm" showTeam={false} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Equipo Conexión</h1>
          <p className="text-gray-500 text-sm mt-0.5">The Life Church Santiago</p>
        </div>

        {mode === "password" ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
            <button
              type="button"
              onClick={() => setMode("magic")}
              className="w-full text-center text-sm text-blue-600 hover:underline"
            >
              Ingresar con enlace por email
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Te enviaremos un enlace de acceso directo a tu email.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="email-magic">Email</Label>
              <Input
                id="email-magic"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </Button>
            <button
              type="button"
              onClick={() => setMode("password")}
              className="w-full text-center text-sm text-blue-600 hover:underline"
            >
              Ingresar con contraseña
            </button>
          </form>
        )}

        <p className="text-xs text-gray-400 text-center mt-6">
          ¿Problemas para acceder? Habla con tu líder.
        </p>
      </div>
    </div>
  )
}
