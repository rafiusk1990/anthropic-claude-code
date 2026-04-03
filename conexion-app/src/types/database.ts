export type UserRole = "leader" | "coordinator" | "volunteer"
export type ServiceTime = "10:00" | "12:00"
export type ScheduleStatus = "draft" | "published"

export interface Profile {
  id: string
  name: string
  phone: string | null
  role: UserRole
  primary_team_id: string | null
  active: boolean
  consent_accepted: boolean
  created_at: string
}

export interface Team {
  id: string
  name: string
  order: number
  created_at: string
}

export interface Area {
  id: string
  team_id: string
  name: string
  order: number
  capacity: number
  created_at: string
  team?: Team
}

export interface Availability {
  id: string
  volunteer_id: string
  sunday_date: string
  available: boolean
  notes: string | null
  volunteer?: Profile
}

export interface Schedule {
  id: string
  year: number
  month: number
  status: ScheduleStatus
  created_by: string
  created_at: string
}

export interface ScheduleSlot {
  id: string
  schedule_id: string
  sunday_date: string
  service_time: ServiceTime
  volunteer_id: string
  area_id: string
  confirmed_present: boolean | null
  volunteer?: Profile
  area?: Area
}

export interface SpecialTask {
  id: string
  name: string
  order: number
  active: boolean
}

export interface TaskAssignment {
  id: string
  sunday_date: string
  task_id: string
  volunteer_ids: string[]
  notes: string | null
  task?: SpecialTask
  volunteers?: Profile[]
}

export interface SundayReport {
  id: string
  sunday_date: string
  volunteers_10am: number
  volunteers_12pm: number
  leaders_10am: number
  leaders_12pm: number
  visitors_10am: number
  visitors_12pm: number
  salvation_10am: number
  salvation_12pm: number
  notes: string | null
  submitted_by: string
  submitted_at: string
  submitter?: Profile
}

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}
