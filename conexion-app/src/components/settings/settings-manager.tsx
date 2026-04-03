"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { Plus, Pencil, Trash2, Users, MapPin, ClipboardList } from "lucide-react"
import type { Team, Area, SpecialTask } from "@/types/database"

interface SettingsManagerProps {
  teams: Team[]
  areas: Area[]
  tasks: SpecialTask[]
}

export function SettingsManager({ teams: initTeams, areas: initAreas, tasks: initTasks }: SettingsManagerProps) {
  const [teams, setTeams] = useState(initTeams)
  const [areas, setAreas] = useState(initAreas)
  const [tasks, setTasks] = useState(initTasks)
  const [activeSection, setActiveSection] = useState<"teams" | "areas" | "tasks">("teams")
  const [modal, setModal] = useState<{ type: string; item: any | null } | null>(null)
  const [form, setForm] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  function openModal(type: string, item: any = null) {
    setForm(item ? { ...item } : { name: "", order: 0, team_id: "", capacity: 1, active: true })
    setModal({ type, item })
  }

  async function handleSaveTeam() {
    setLoading(true)
    if (modal?.item) {
      const { error } = await supabase.from("teams").update({ name: form.name, order: form.order }).eq("id", modal.item.id)
      if (!error) setTeams(prev => prev.map(t => t.id === modal.item.id ? { ...t, ...form } : t))
    } else {
      const { data, error } = await supabase.from("teams").insert({ name: form.name, order: teams.length }).select().single()
      if (!error && data) setTeams(prev => [...prev, data])
    }
    setModal(null)
    setLoading(false)
    toast("Guardado", "success")
  }

  async function handleSaveArea() {
    setLoading(true)
    if (modal?.item) {
      const { error } = await supabase.from("areas").update({ name: form.name, order: form.order, capacity: form.capacity || 1, team_id: form.team_id }).eq("id", modal.item.id)
      if (!error) setAreas(prev => prev.map(a => a.id === modal.item.id ? { ...a, ...form } : a))
    } else {
      const { data, error } = await supabase.from("areas").insert({ name: form.name, team_id: form.team_id, order: areas.length, capacity: form.capacity || 1 }).select("*, team:teams(name)").single()
      if (!error && data) setAreas(prev => [...prev, data as any])
    }
    setModal(null)
    setLoading(false)
    toast("Guardado", "success")
  }

  async function handleSaveTask() {
    setLoading(true)
    if (modal?.item) {
      const { error } = await supabase.from("special_tasks").update({ name: form.name, order: form.order, active: form.active }).eq("id", modal.item.id)
      if (!error) setTasks(prev => prev.map(t => t.id === modal.item.id ? { ...t, ...form } : t))
    } else {
      const { data, error } = await supabase.from("special_tasks").insert({ name: form.name, order: tasks.length, active: true }).select().single()
      if (!error && data) setTasks(prev => [...prev, data])
    }
    setModal(null)
    setLoading(false)
    toast("Guardado", "success")
  }

  async function handleDelete(table: string, id: string, setter: any) {
    const { error } = await supabase.from(table).delete().eq("id", id)
    if (!error) setter((prev: any[]) => prev.filter(i => i.id !== id))
    toast("Eliminado", "success")
  }

  const sections = [
    { key: "teams" as const, label: "Equipos", icon: Users, count: teams.length },
    { key: "areas" as const, label: "Áreas", icon: MapPin, count: areas.length },
    { key: "tasks" as const, label: "Tareas especiales", icon: ClipboardList, count: tasks.length },
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sections.map(s => {
          const Icon = s.icon
          return (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === s.key ? "bg-black text-white" : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {s.label}
              <Badge variant={activeSection === s.key ? "secondary" : "outline"} className="ml-1 text-[10px]">{s.count}</Badge>
            </button>
          )
        })}
      </div>

      {/* Teams */}
      {activeSection === "teams" && (
        <div className="space-y-2">
          <Button size="sm" onClick={() => openModal("team")} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Agregar equipo
          </Button>
          {teams.map(t => (
            <Card key={t.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <span className="font-medium text-sm">{t.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => openModal("team", t)} className="p-1.5 text-gray-400 hover:text-gray-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete("teams", t.id, setTeams)} className="p-1.5 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Areas */}
      {activeSection === "areas" && (
        <div className="space-y-2">
          <Button size="sm" onClick={() => openModal("area")} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Agregar área
          </Button>
          {areas.map(a => (
            <Card key={a.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{a.name}</div>
                  <div className="text-xs text-gray-500">{(a as any).team?.name} · Cap. {a.capacity}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openModal("area", a)} className="p-1.5 text-gray-400 hover:text-gray-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete("areas", a.id, setAreas)} className="p-1.5 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tasks */}
      {activeSection === "tasks" && (
        <div className="space-y-2">
          <Button size="sm" onClick={() => openModal("task")} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Agregar tarea
          </Button>
          {tasks.map(t => (
            <Card key={t.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{t.name}</div>
                  {!t.active && <Badge variant="outline" className="text-[10px] mt-0.5">Inactiva</Badge>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openModal("task", t)} className="p-1.5 text-gray-400 hover:text-gray-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete("special_tasks", t.id, setTasks)} className="p-1.5 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <Dialog open={!!modal} onOpenChange={open => !open && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modal?.item ? "Editar" : "Agregar"}{" "}
              {modal?.type === "team" ? "equipo" : modal?.type === "area" ? "área" : "tarea"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.name || ""} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} className="mt-1" />
            </div>
            {modal?.type === "area" && (
              <>
                <div>
                  <Label>Equipo *</Label>
                  <select
                    value={form.team_id || ""}
                    onChange={e => setForm((p: any) => ({ ...p, team_id: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="">— Seleccionar equipo —</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Capacidad (voluntarios por slot)</Label>
                  <Input type="number" min={1} value={form.capacity || 1} onChange={e => setForm((p: any) => ({ ...p, capacity: Number(e.target.value) }))} className="mt-1" />
                </div>
              </>
            )}
            {modal?.type === "task" && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active-task"
                  checked={form.active !== false}
                  onChange={e => setForm((p: any) => ({ ...p, active: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="active-task">Activa</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button
              onClick={modal?.type === "team" ? handleSaveTeam : modal?.type === "area" ? handleSaveArea : handleSaveTask}
              disabled={loading || !form.name?.trim()}
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
