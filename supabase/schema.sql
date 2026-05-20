create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text unique,
  phone text unique,
  photo_path text,
  created_at timestamptz not null default now()
);

create table if not exists members (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  member_code text unique not null,
  personal_trainer_id uuid references staff(id) on delete set null,
  active boolean not null default true,
  joined_at timestamptz not null default now()
);

create table if not exists staff (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  staff_code text unique not null,
  role text not null check (role in ('admin', 'trainer')),
  specialization text,
  active boolean not null default true
);

create table if not exists memberships (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references members(id) on delete cascade,
  plan_name text not null,
  start_date date not null,
  end_date date not null,
  total_fee numeric(10,2) not null default 0,
  due_amount numeric(10,2) not null default 0,
  status text not null check (status in ('active', 'expiring', 'expired', 'due'))
);

create table if not exists membership_packages (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  duration_days integer not null check (duration_days > 0),
  price numeric(10,2) not null default 0,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references members(id) on delete cascade,
  amount numeric(10,2) not null,
  method text not null check (method in ('cash', 'upi', 'card', 'bank-transfer')),
  paid_on date not null,
  notes text,
  received_by uuid references staff(id)
);

create table if not exists attendance_events (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid not null,
  actor_type text not null check (actor_type in ('member', 'trainer')),
  source text not null check (source in ('kiosk', 'qr', 'trainer-login', 'trainer-logout')),
  result text not null check (result in ('success', 'duplicate', 'invalid', 'blocked')),
  occurred_at timestamptz not null default now(),
  note text
);

create table if not exists daily_attendance (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid not null,
  actor_type text not null check (actor_type in ('member', 'trainer')),
  attendance_date date not null,
  first_event_id uuid references attendance_events(id),
  unique(actor_id, actor_type, attendance_date)
);

create table if not exists alert_queue (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references members(id) on delete set null,
  title text not null,
  description text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  due_on date,
  created_at timestamptz not null default now()
);

create table if not exists ui_activity_logs (
  id uuid primary key default uuid_generate_v4(),
  occurred_at timestamptz not null default now(),
  actor_role text not null check (actor_role in ('admin', 'trainer', 'member', 'system', 'unknown')),
  actor_code text,
  action_code text not null,
  status text not null default 'success' check (status in ('success', 'error', 'blocked')),
  target_type text check (target_type in ('member', 'trainer', 'admin', 'payment', 'package', 'system')),
  target_code text,
  amount numeric(10,2),
  context text,
  detail text,
  meta jsonb
);

create index if not exists ui_activity_logs_occurred_at_idx on ui_activity_logs (occurred_at desc);
create index if not exists ui_activity_logs_action_code_idx on ui_activity_logs (action_code);
create index if not exists ui_activity_logs_target_code_idx on ui_activity_logs (target_code);

create table if not exists id_counters (
  counter_key text primary key,
  current_value integer not null check (current_value >= 0),
  prefix text not null,
  padding integer not null default 3,
  updated_at timestamptz not null default now()
);

insert into id_counters (counter_key, current_value, prefix, padding)
values
  ('member_code', 1000, 'LUXE-', 4),
  ('trainer_code', 0, 'LUXE-TR-', 3)
on conflict (counter_key) do nothing;

create or replace function ensure_member_code_counter()
returns void
language plpgsql
as $$
declare
  max_existing integer;
begin
  insert into id_counters (counter_key, current_value, prefix, padding)
  values ('member_code', 1000, 'LUXE-', 4)
  on conflict (counter_key) do nothing;

  select coalesce(max((regexp_match(member_code, '^LUXE-(\d+)$'))[1]::integer), 1000)
  into max_existing
  from members;

  update id_counters
  set current_value = greatest(current_value, max_existing),
      updated_at = now()
  where counter_key = 'member_code';
end;
$$;

create or replace function ensure_trainer_code_counter()
returns void
language plpgsql
as $$
declare
  max_existing integer;
begin
  insert into id_counters (counter_key, current_value, prefix, padding)
  values ('trainer_code', 0, 'LUXE-TR-', 3)
  on conflict (counter_key) do nothing;

  select coalesce(max((regexp_match(staff_code, '^LUXE-TR-(\d+)$'))[1]::integer), 0)
  into max_existing
  from staff;

  update id_counters
  set current_value = greatest(current_value, max_existing),
      updated_at = now()
  where counter_key = 'trainer_code';
end;
$$;

create or replace function peek_member_code()
returns text
language plpgsql
as $$
declare
  counter_row id_counters%rowtype;
begin
  perform ensure_member_code_counter();

  select *
  into counter_row
  from id_counters
  where counter_key = 'member_code';

  return counter_row.prefix || lpad((counter_row.current_value + 1)::text, counter_row.padding, '0');
end;
$$;

create or replace function reserve_member_code()
returns text
language plpgsql
as $$
declare
  counter_row id_counters%rowtype;
begin
  perform ensure_member_code_counter();

  update id_counters
  set current_value = current_value + 1,
      updated_at = now()
  where counter_key = 'member_code'
  returning *
  into counter_row;

  return counter_row.prefix || lpad(counter_row.current_value::text, counter_row.padding, '0');
end;
$$;

create or replace function peek_trainer_code()
returns text
language plpgsql
as $$
declare
  counter_row id_counters%rowtype;
begin
  perform ensure_trainer_code_counter();

  select *
  into counter_row
  from id_counters
  where counter_key = 'trainer_code';

  return counter_row.prefix || lpad((counter_row.current_value + 1)::text, counter_row.padding, '0');
end;
$$;

create or replace function reserve_trainer_code()
returns text
language plpgsql
as $$
declare
  counter_row id_counters%rowtype;
begin
  perform ensure_trainer_code_counter();

  update id_counters
  set current_value = current_value + 1,
      updated_at = now()
  where counter_key = 'trainer_code'
  returning *
  into counter_row;

  return counter_row.prefix || lpad(counter_row.current_value::text, counter_row.padding, '0');
end;
$$;
