"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { Plus, Search, Pencil, UserX, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile, Team } from "@/types/database"

interface VolunteerManagerProps {
  volunteers: any[]
  teams: Team[]
  currentUserId: string
}

const ROLES = [
  { value: "volunteer", label: "Voluntario/a" },
  { value: "coordinator", label: "Coordinador/a" },
  { value: "leader", label: "Líder" },
]

const emptyForm = {
  name: "", email: "", phone: "",
  role: "volunteer" as const,
  primary_team_id: "",
}

export function VolunteerManager({ volunteers: initial, teams, currentUserId }: VolunteerManagerProps) {
  const [volunteers, setVolunteers] = useState(initial)
  const [search, setSearch] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [modal, setModal] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null })
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  function openNew() {
    setForm(emptyForm)
    setModal({ open: true, editing: null })
  }

  function openEdit(v: any) {
    setForm({ name: v.name, email: v.email || "", phone: v.phone || "", role: v.role, primary_team_id: v.primary_team_id || "" })
    setModal({ open: true, editing: v })
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      toast("Nombre y email son obligatorios", "error")
      return
    }
    setLoading(true)
    try {
      if (modal.editing) {
        // Update existing
        const { error } = await supabase.from("profiles")
          .update({ name: form.name, phone: form.phone || null, role: form.role, primary_team_id: form.primary_team_id || null })
          .eq("id", modal.editing.id)
        if (error) throw error
        setVolunteers(prev => prev.map(v => v.id === modal.editing.id ? { ...v, ...form } : v))
        toast("Voluntario actualizado", "success")
      } else {
        // Invite new user via Supabase Admin — create profile after auth invite
        const res = await fetch("/api/volunteers/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Error al invitar")
        setVolunteers(prev => [data.profile, ...prev])
        toast(`Invitación enviada a ${form.email}`, "success")
      }
      setModal({ open: false, editing: null })
    } catch (e: any) {
      toast(e.message || "Error al guardar", "error")
    }
    setLoading(false)
  }

  async function toggleActive(v: any) {
    if (v.id === currentUserId) return
    const newActive = !v.active
    const { error } = await supabase.from("profiles").update({ active: newActive }).eq("id", v.id)
    if (!error) {
      setVolunteers(prev => prev.map(vol => vol.id === v.id ? { ...vol, active: newActive } : vol))
      toast(newActive ? "Voluntario reactivado" : "Voluntario desactivado", "info")
    }
  }

  const filtered = volunteers.filter(v =>
    (showInactive || v.active) &&
    (v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.email || "").toLowerCase().includes(search.toLowerCase()))
  )

  const activeCount = volunteers.filter(v => v.active).length

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openNew} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{activeCount} voluntarios activos</span>
        <button onClick={() => setShowInactive(v => !v)} className="flex items-center gap-1 text-xs">
          {showInactive ? "Ocultar inactivos" : "Ver inactivos"}
          {showInactive ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map(v => {
          const teamName = v.team?.name || teams.find(t => t.id === v.primary_team_id)?.name
          return (
            <Card key={v.id} className={cn(!v.active && "opacity-50")}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{v.name}</span>
                    <Badge variant={v.role === "leader" ? "default" : v.role === "coordinator" ? "success" : "secondary"} className="text-[10px]">
                      {ROLES.find(r => r.value === v.role)?.label}
                    </Badge>
                    {!v.active && <Badge variant="outline" className="text-[10px]">Inactivo</Badge>}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {v.email} {teamName && `· ${teamName}`}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(v)} className="p-1.5 text-gray-400 hover:text-gray-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                  {v.id !== currentUserId && (
                    <button onClick={() => toggleActive(v)} className="p-1.5 text-gray-400 hover:text-red-500">
                      <UserX className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Sin resultados</p>
        )}
      </div>

      {/* Add/Edit modal */}
      <Dialog open={modal.open} onOpenChange={open => setModal({ open, editing: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal.editing ? "Editar voluntario" : "Agregar voluntario"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre completo *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nombre Apellido" className="mt-1" />
            </div>
            {!modal.editing && (
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@ejemplo.com" className="mt-1" />
                <p className="text-xs text-gray-400 mt-1">Se enviará un enlace de acceso a este email.</p>
              </div>
            )}
            <div>
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+56 9 1234 5678" className="mt-1" />
            </div>
            <div>
              <Label>Rol</Label>
              <select
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Equipo principal</Label>
              <select
                value={form.primary_team_id}
                onChange={e => setForm(p => ({ ...p, primary_team_id: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="">— Sin equipo —</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModal({ open: false, editing: null })}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Guardando..." : modal.editing ? "Guardar" : "Invitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
