-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Helper function to get current user role
create or replace function get_user_role()
returns user_role as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer stable;

-- =============================================
-- PROFILES
-- =============================================
alter table profiles enable row level security;

-- View own profile always
create policy "profiles_select_own" on profiles for select
  using (id = auth.uid());

-- Leaders and coordinators can view all profiles
create policy "profiles_select_leaders" on profiles for select
  using (get_user_role() in ('leader', 'coordinator'));

-- Users can update their own profile (limited fields via app)
create policy "profiles_update_own" on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Leaders can insert/update all profiles
create policy "profiles_leader_insert" on profiles for insert
  with check (get_user_role() = 'leader');

create policy "profiles_leader_update" on profiles for update
  using (get_user_role() = 'leader');

-- =============================================
-- TEAMS
-- =============================================
alter table teams enable row level security;

create policy "teams_select_all_authenticated" on teams for select
  using (auth.uid() is not null);

create policy "teams_leader_write" on teams for all
  using (get_user_role() = 'leader')
  with check (get_user_role() = 'leader');

-- =============================================
-- AREAS
-- =============================================
alter table areas enable row level security;

create policy "areas_select_all_authenticated" on areas for select
  using (auth.uid() is not null);

create policy "areas_leader_write" on areas for all
  using (get_user_role() = 'leader')
  with check (get_user_role() = 'leader');

-- =============================================
-- AVAILABILITY
-- =============================================
alter table availability enable row level security;

-- Leaders and coordinators can manage all availability
create policy "availability_leader_all" on availability for all
  using (get_user_role() in ('leader', 'coordinator'))
  with check (get_user_role() in ('leader', 'coordinator'));

-- Volunteers can only see their own availability
create policy "availability_volunteer_select_own" on availability for select
  using (volunteer_id = auth.uid());

-- =============================================
-- SCHEDULES
-- =============================================
alter table schedules enable row level security;

-- Published schedules visible to all
create policy "schedules_select_published" on schedules for select
  using (status = 'published' and auth.uid() is not null);

-- Leaders and coordinators can see drafts too
create policy "schedules_select_leaders" on schedules for select
  using (get_user_role() in ('leader', 'coordinator'));

-- Leaders and coordinators can write
create policy "schedules_leader_write" on schedules for all
  using (get_user_role() in ('leader', 'coordinator'))
  with check (get_user_role() in ('leader', 'coordinator'));

-- =============================================
-- SCHEDULE SLOTS
-- =============================================
alter table schedule_slots enable row level security;

-- Volunteers can see their own slots
create policy "slots_volunteer_own" on schedule_slots for select
  using (volunteer_id = auth.uid());

-- Leaders and coordinators see all slots
create policy "slots_leader_select" on schedule_slots for select
  using (get_user_role() in ('leader', 'coordinator'));

-- Leaders and coordinators write all slots
create policy "slots_leader_write" on schedule_slots for all
  using (get_user_role() in ('leader', 'coordinator'))
  with check (get_user_role() in ('leader', 'coordinator'));

-- =============================================
-- SPECIAL TASKS
-- =============================================
alter table special_tasks enable row level security;

create policy "tasks_select_all" on special_tasks for select
  using (auth.uid() is not null);

create policy "tasks_leader_write" on special_tasks for all
  using (get_user_role() = 'leader')
  with check (get_user_role() = 'leader');

-- =============================================
-- TASK ASSIGNMENTS
-- =============================================
alter table task_assignments enable row level security;

create policy "task_assignments_leader_all" on task_assignments for all
  using (get_user_role() in ('leader', 'coordinator'))
  with check (get_user_role() in ('leader', 'coordinator'));

create policy "task_assignments_volunteer_select" on task_assignments for select
  using (auth.uid() = any(volunteer_ids));

-- =============================================
-- SUNDAY REPORTS
-- =============================================
alter table sunday_reports enable row level security;

create policy "reports_leader_all" on sunday_reports for all
  using (get_user_role() in ('leader', 'coordinator'))
  with check (get_user_role() in ('leader', 'coordinator'));

-- =============================================
-- PUSH SUBSCRIPTIONS
-- =============================================
alter table push_subscriptions enable row level security;

create policy "push_own" on push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
