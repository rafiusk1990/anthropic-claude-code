import { redirect } from "next/navigation"

export default function ScheduleRedirect() {
  const now = new Date()
  redirect(`/schedule/${now.getFullYear()}/${now.getMonth() + 1}`)
}
