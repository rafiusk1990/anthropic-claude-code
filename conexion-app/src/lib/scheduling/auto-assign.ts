import type { Area, Availability, Profile, ScheduleSlot } from "@/types/database"

interface AutoAssignInput {
  sundays: string[] // ISO dates
  volunteers: Profile[]
  areas: Area[]
  availability: Availability[]
  existingSlots?: ScheduleSlot[]
  scheduleId: string
}

interface SuggestedSlot {
  schedule_id: string
  sunday_date: string
  service_time: "10:00" | "12:00"
  volunteer_id: string
  area_id: string
  confirmed_present: null
}

export function autoAssign(input: AutoAssignInput): SuggestedSlot[] {
  const { sundays, volunteers, areas, availability, scheduleId } = input
  const serviceTimes: ("10:00" | "12:00")[] = ["10:00", "12:00"]

  // Build availability lookup: volunteer_id -> Set<sunday_date>
  const availMap = new Map<string, Set<string>>()
  for (const a of availability) {
    if (a.available) {
      if (!availMap.has(a.volunteer_id)) availMap.set(a.volunteer_id, new Set())
      availMap.get(a.volunteer_id)!.add(a.sunday_date)
    }
  }

  // Track assignments per volunteer this month: id -> count
  const assignCount = new Map<string, number>(volunteers.map(v => [v.id, 0]))

  // Track last assignment date per volunteer
  const lastAssigned = new Map<string, string>()

  const result: SuggestedSlot[] = []

  for (const sunday of sundays) {
    // Track who is already assigned this day (to avoid double-booking)
    const assignedToday = new Set<string>()

    for (const serviceTime of serviceTimes) {
      for (const area of areas.sort((a, b) => a.order - b.order)) {
        const capacity = area.capacity || 1

        // Candidates: available that day, in the right team, not yet assigned today
        const candidates = volunteers.filter(v => {
          const avail = availMap.get(v.id)
          return (
            v.active &&
            v.primary_team_id === area.team_id &&
            avail?.has(sunday) &&
            !assignedToday.has(v.id)
          )
        })

        // Sort by rotation fairness: fewest assignments first, then least recently assigned
        candidates.sort((a, b) => {
          const countDiff = (assignCount.get(a.id) ?? 0) - (assignCount.get(b.id) ?? 0)
          if (countDiff !== 0) return countDiff
          const lastA = lastAssigned.get(a.id) ?? "0000-00-00"
          const lastB = lastAssigned.get(b.id) ?? "0000-00-00"
          return lastA < lastB ? -1 : 1
        })

        const selected = candidates.slice(0, capacity)
        for (const volunteer of selected) {
          result.push({
            schedule_id: scheduleId,
            sunday_date: sunday,
            service_time: serviceTime,
            volunteer_id: volunteer.id,
            area_id: area.id,
            confirmed_present: null,
          })
          assignedToday.add(volunteer.id)
          assignCount.set(volunteer.id, (assignCount.get(volunteer.id) ?? 0) + 1)
          lastAssigned.set(volunteer.id, sunday)
        }
      }
    }
  }

  return result
}
