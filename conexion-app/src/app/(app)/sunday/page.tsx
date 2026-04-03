import { redirect } from "next/navigation"
import { toISODate } from "@/lib/utils"

export default function SundayRedirect() {
  // Find next Sunday
  const today = new Date()
  const day = today.getDay()
  const daysUntilSunday = day === 0 ? 0 : 7 - day
  const nextSunday = new Date(today)
  nextSunday.setDate(today.getDate() + daysUntilSunday)
  redirect(`/sunday/${toISODate(nextSunday)}`)
}
