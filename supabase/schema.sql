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
