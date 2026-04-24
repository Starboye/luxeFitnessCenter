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
