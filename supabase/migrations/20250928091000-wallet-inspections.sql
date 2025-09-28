-- Create wallet_inspections table to store per-user wallet inspection results
-- Includes RLS policies to restrict access to the owning user

create extension if not exists pgcrypto;

create table if not exists public.wallet_inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  address text not null,
  chain text,
  risk_level text,
  risk_score int,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists wallet_inspections_user_id_idx on public.wallet_inspections(user_id);
create index if not exists wallet_inspections_created_at_idx on public.wallet_inspections(created_at desc);

-- Enable Row Level Security
alter table public.wallet_inspections enable row level security;

-- Policies: users can CRUD only their own rows
create policy "wallet_inspections_insert_own"
  on public.wallet_inspections
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "wallet_inspections_select_own"
  on public.wallet_inspections
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "wallet_inspections_update_own"
  on public.wallet_inspections
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "wallet_inspections_delete_own"
  on public.wallet_inspections
  for delete
  to authenticated
  using (user_id = auth.uid());