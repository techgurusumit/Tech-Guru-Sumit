-- TGS Tournament Manager: live public fixture / scorecard sharing
-- Run this whole file once in Supabase SQL Editor.

create or replace function public.tgs_share_views_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.tgs_share_views (
  id uuid primary key default gen_random_uuid(),
  tournament_id bigint not null,
  view_type text not null check (view_type in ('fixtures','scorecard')),
  public_token text not null unique,
  owner_token text not null unique,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tgs_share_views enable row level security;
revoke all on table public.tgs_share_views from anon, authenticated;

drop trigger if exists tgs_share_views_updated_at on public.tgs_share_views;
create trigger tgs_share_views_updated_at
before update on public.tgs_share_views
for each row execute function public.tgs_share_views_set_updated_at();

create or replace function public.tgs_create_share(
  p_tournament_id text,
  p_view_type text,
  p_snapshot jsonb,
  p_public_token text,
  p_owner_token text
)
returns table(public_token text, owner_token text, view_type text, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_view_type not in ('fixtures','scorecard') then raise exception 'Invalid view type'; end if;
  if length(p_public_token) < 32 or length(p_owner_token) < 48 then raise exception 'Invalid share token'; end if;
  insert into public.tgs_share_views(tournament_id,view_type,public_token,owner_token,snapshot)
  values(p_tournament_id::bigint,p_view_type,p_public_token,p_owner_token,p_snapshot);
  return query
    select s.public_token,s.owner_token,s.view_type,s.updated_at
    from public.tgs_share_views s where s.owner_token=p_owner_token;
end;
$$;

create or replace function public.tgs_update_share(p_owner_token text,p_snapshot jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare changed_at timestamptz;
begin
  update public.tgs_share_views
     set snapshot=p_snapshot, updated_at=now()
   where owner_token=p_owner_token
  returning updated_at into changed_at;
  if changed_at is null then raise exception 'Invalid share owner token'; end if;
  return changed_at;
end;
$$;

create or replace function public.tgs_get_share(p_public_token text)
returns table(view_type text, snapshot jsonb, updated_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  select s.view_type,s.snapshot,s.updated_at
  from public.tgs_share_views s
  where s.public_token=p_public_token
  limit 1;
$$;

revoke execute on function public.tgs_share_views_set_updated_at() from public, anon, authenticated;
revoke execute on function public.tgs_create_share(text,text,jsonb,text,text) from public;
revoke execute on function public.tgs_update_share(text,jsonb) from public;
revoke execute on function public.tgs_get_share(text) from public;

grant execute on function public.tgs_create_share(text,text,jsonb,text,text) to anon, authenticated;
grant execute on function public.tgs_update_share(text,jsonb) to anon, authenticated;
grant execute on function public.tgs_get_share(text) to anon, authenticated;
