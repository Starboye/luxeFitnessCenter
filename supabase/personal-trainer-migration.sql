alter table public.members
add column if not exists personal_trainer_id uuid references public.staff(id) on delete set null;
