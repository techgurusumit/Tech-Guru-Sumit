-- TGS Tournament Manager v2 online storage
create table if not exists public.tgs_manager_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{"games":[],"players":[],"tournaments":[],"fixtures":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.tgs_manager_state enable row level security;
drop policy if exists "tgs_manager_state_select_own" on public.tgs_manager_state;
drop policy if exists "tgs_manager_state_insert_own" on public.tgs_manager_state;
drop policy if exists "tgs_manager_state_update_own" on public.tgs_manager_state;
create policy "tgs_manager_state_select_own" on public.tgs_manager_state for select to authenticated using (user_id = auth.uid());
create policy "tgs_manager_state_insert_own" on public.tgs_manager_state for insert to authenticated with check (user_id = auth.uid());
create policy "tgs_manager_state_update_own" on public.tgs_manager_state for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update on public.tgs_manager_state to authenticated;
