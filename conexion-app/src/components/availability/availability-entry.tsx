"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { formatShortDate } from "@/lib/utils"
import { Check, X, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface AvailabilityEntryProps {
  year: number
  month: number
  sundays: string[]
  volunteers: any[]
  availability: any[]
}

type AvailState = boolean | null

function buildAvailMap(availability: any[]): Map<string, AvailState> {
  const map = new Map<string, AvailState>()
  for (const a of availability) {
    map.set(`${a.volunteer_id}:${a.sunday_date}`, a.available)
  }
  return map
}

export function AvailabilityEntry({ sundays, volunteers, availability }: AvailabilityEntryProps) {
  const [availMap, setAvailMap] = useState<Map<string, AvailState>>(buildAvailMap(availability))
  const [saving, setSaving] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  async function toggle(volunteerId: string, sunday: string) {
    const key = `${volunteerId}:${sunday}`
    const current = availMap.get(key) ?? null
    // cycle: null → true → false → null
    const next: AvailState = current === null ? true : current === true ? false : null

    setSaving(key)
    try {
      if (next === null) {
        await supabase.from("availability")
          .delete()
          .eq("volunteer_id", volunteerId)
          .eq("sunday_date", sunday)
      } else {
        await supabase.from("availability").upsert(
          { volunteer_id: volunteerId, sunday_date: sunday, available: next },
          { onConflict: "volunteer_id,sunday_date" }
        )
      }
      setAvailMap(prev => {
        const next2 = new Map(prev)
        if (next === null) next2.delete(key)
        else next2.set(key, next)
        return next2
      })
    } catch {
      toast("Error al guardar", "error")
    }
    setSaving(null)
  }

  async function setAllForVolunteer(volunteerId: string, value: boolean) {
    const updates = sundays.map(s => ({ volunteer_id: volunteerId, sunday_date: s, available: value }))
    await supabase.from("availability").upsert(updates, { onConflict: "volunteer_id,sunday_date" })
    setAvailMap(prev => {
      const next = new Map(prev)
      sundays.forEach(s => next.set(`${volunteerId}:${s}`, value))
      return next
    })
    toast("Disponibilidad guardada", "success")
  }

  return (
    <div className="p-4">
      <p className="text-sm text-gray-500 mb-3">
        Ingresa la disponibilidad de cada voluntario según las respuestas del WhatsApp.
        Verde = disponible, Rojo = no disponible, Gris = sin respuesta.
      </p>

      {/* Legend */}
      <div className="flex gap-3 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-green-500 inline-block" /> Disponible</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-200 inline-block" /> No disponible</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gray-200 inline-block" /> Sin respuesta</span>
      </div>

      <div className="overflow-x-auto -mx-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left pl-4 pr-3 py-2 text-gray-600 font-medium sticky left-0 bg-gray-50 min-w-[120px]">
                Voluntario
              </th>
              {sundays.map(s => (
                <th key={s} className="text-center px-2 py-2 text-gray-600 font-medium min-w-[60px]">
                  {formatShortDate(s + "T12:00:00")}
                </th>
              ))}
              <th className="px-2 text-gray-500 font-normal text-xs">Todo</th>
            </tr>
          </thead>
          <tbody>
            {volunteers.map(v => (
              <tr key={v.id} className="border-t border-gray-100">
                <td className="pl-4 pr-3 py-2 sticky left-0 bg-white">
                  <div className="font-medium leading-tight">{v.name.split(" ")[0]}</div>
                  <div className="text-[10px] text-gray-400">{v.team?.name || ""}</div>
                </td>
                {sundays.map(s => {
                  const key = `${v.id}:${s}`
                  const state = availMap.get(key) ?? null
                  const isSaving = saving === key
                  return (
                    <td key={s} className="text-center px-2 py-2">
                      <button
                        onClick={() => toggle(v.id, s)}
                        disabled={!!saving}
                        className={cn(
                          "w-8 h-8 rounded-lg mx-auto flex items-center justify-center transition-colors",
                          state === true && "bg-green-500 text-white",
                          state === false && "bg-red-100 text-red-500",
                          state === null && "bg-gray-100 text-gray-300",
                          isSaving && "opacity-50"
                        )}
                      >
                        {state === true && <Check className="h-3.5 w-3.5" />}
                        {state === false && <X className="h-3.5 w-3.5" />}
                        {state === null && <Minus className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  )
                })}
                <td className="px-2 py-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setAllForVolunteer(v.id, true)}
                      className="text-[10px] px-1.5 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setAllForVolunteer(v.id, false)}
                      className="text-[10px] px-1.5 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Ninguno
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
