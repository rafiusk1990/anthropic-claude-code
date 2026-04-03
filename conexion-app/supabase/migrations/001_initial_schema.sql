-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================
create type user_role as enum ('leader', 'coordinator', 'volunteer');
create type service_time as enum ('10:00', '12:00');
create type schedule_status as enum ('draft', 'published');

-- =============================================
-- TEAMS
-- =============================================
create table teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  "order" int not null default 0,
  created_at timestamptz not null default now()
);

-- =============================================
-- AREAS
-- =============================================
create table areas (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  "order" int not null default 0,
  capacity int not null default 1,
  created_at timestamptz not null default now()
);

-- =============================================
-- PROFILES (extends Supabase Auth users)
-- =============================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  role user_role not null default 'volunteer',
  primary_team_id uuid references teams(id) on delete set null,
  active boolean not null default true,
  consent_accepted boolean not null default false,
  created_at timestamptz not null default now()
);

-- =============================================
-- AVAILABILITY
-- =============================================
create table availability (
  id uuid primary key default uuid_generate_v4(),
  volunteer_id uuid not null references profiles(id) on delete cascade,
  sunday_date date not null,
  available boolean not null default true,
  notes text,
  unique (volunteer_id, sunday_date)
);

-- =============================================
-- SCHEDULES
-- =============================================
create table schedules (
  id uuid primary key default uuid_generate_v4(),
  year int not null,
  month int not null check (month between 1 and 12),
  status schedule_status not null default 'draft',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (year, month)
);

-- =============================================
-- SCHEDULE SLOTS
-- =============================================
create table schedule_slots (
  id uuid primary key default uuid_generate_v4(),
  schedule_id uuid not null references schedules(id) on delete cascade,
  sunday_date date not null,
  service_time service_time not null,
  volunteer_id uuid not null references profiles(id) on delete cascade,
  area_id uuid not null references areas(id) on delete cascade,
  confirmed_present boolean default null
);

create index idx_slots_schedule on schedule_slots(schedule_id);
create index idx_slots_volunteer on schedule_slots(volunteer_id);
create index idx_slots_sunday on schedule_slots(sunday_date);

-- =============================================
-- SPECIAL TASKS
-- =============================================
create table special_tasks (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  "order" int not null default 0,
  active boolean not null default true
);

-- =============================================
-- TASK ASSIGNMENTS
-- =============================================
create table task_assignments (
  id uuid primary key default uuid_generate_v4(),
  sunday_date date not null,
  task_id uuid not null references special_tasks(id) on delete cascade,
  volunteer_ids uuid[] not null default '{}',
  notes text,
  unique (sunday_date, task_id)
);

-- =============================================
-- SUNDAY REPORTS
-- =============================================
create table sunday_reports (
  id uuid primary key default uuid_generate_v4(),
  sunday_date date not null unique,
  volunteers_10am int not null default 0,
  volunteers_12pm int not null default 0,
  leaders_10am int not null default 0,
  leaders_12pm int not null default 0,
  visitors_10am int not null default 0,
  visitors_12pm int not null default 0,
  salvation_10am int not null default 0,
  salvation_12pm int not null default 0,
  notes text,
  submitted_by uuid references profiles(id),
  submitted_at timestamptz
);

-- =============================================
-- PUSH SUBSCRIPTIONS
-- =============================================
create table push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade unique,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- =============================================
-- REALTIME
-- =============================================
alter publication supabase_realtime add table schedule_slots;
alter publication supabase_realtime add table task_assignments;
alter publication supabase_realtime add table schedules;
