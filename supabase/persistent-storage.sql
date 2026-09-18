-- TGS Tournament Manager persistent account + tournament storage
-- Run this file once in Supabase SQL Editor.

create table if not exists public.tgs_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tgs_tournaments (
  id bigint primary key,
  owner_user_id uuid not null references public.tgs_users(id) on delete cascade,
  name text not null,
  game text not null,
  format text not null,
  players integer not null,
  player_names jsonb not null default '[]'::jsonb,
  status text not null,
  tournament_date text not null,
  tournament_password text not null default '',
  password_enabled boolean not null default true,
  fixtures jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tgs_tournaments_owner_idx on public.tgs_tournaments(owner_user_id);
create unique index if not exists tgs_users_email_lower_idx on public.tgs_users(lower(email));

alter table public.tgs_users enable row level security;
alter table public.tgs_tournaments enable row level security;

revoke all on public.tgs_users from anon, authenticated;
revoke all on public.tgs_tournaments from anon, authenticated;

create or replace function public.tgs_register_user(
  p_name text,
  p_email text,
  p_password_hash text
) returns public.tgs_users
language plpgsql
security definer
set search_path = ''
as $$
declare v_user public.tgs_users;
begin
  insert into public.tgs_users(name,email,password_hash)
  values(trim(p_name), lower(trim(p_email)), p_password_hash)
  returning * into v_user;
  return v_user;
end;
$$;

create or replace function public.tgs_login_user(
  p_email text,
  p_password_hash text
) returns public.tgs_users
language sql
security definer
set search_path = ''
as $$
  select u.*
  from public.tgs_users u
  where lower(u.email)=lower(trim(p_email))
    and u.password_hash=p_password_hash
  limit 1;
$$;

create or replace function public.tgs_list_tournaments(p_owner_user_id uuid)
returns setof public.tgs_tournaments
language sql
security definer
set search_path = ''
as $$
  select t.*
  from public.tgs_tournaments t
  where t.owner_user_id=p_owner_user_id
  order by t.created_at desc;
$$;

create or replace function public.tgs_upsert_tournament(
  p_owner_user_id uuid,
  p_tournament jsonb
) returns public.tgs_tournaments
language plpgsql
security definer
set search_path = ''
as $$
declare v public.tgs_tournaments;
begin
  insert into public.tgs_tournaments(
    id,owner_user_id,name,game,format,players,player_names,status,
    tournament_date,tournament_password,password_enabled,fixtures
  )
  values(
    (p_tournament->>'id')::bigint,
    p_owner_user_id,
    coalesce(p_tournament->>'name',''),
    coalesce(p_tournament->>'game',''),
    coalesce(p_tournament->>'format',''),
    coalesce((p_tournament->>'players')::integer,2),
    coalesce(p_tournament->'playerNames','[]'::jsonb),
    coalesce(p_tournament->>'status','Upcoming'),
    coalesce(p_tournament->>'date',''),
    coalesce(p_tournament->>'password',''),
    coalesce((p_tournament->>'passwordEnabled')::boolean,true),
    coalesce(p_tournament->'fixtures','[]'::jsonb)
  )
  on conflict(id) do update set
    owner_user_id=excluded.owner_user_id,
    name=excluded.name,
    game=excluded.game,
    format=excluded.format,
    players=excluded.players,
    player_names=excluded.player_names,
    status=excluded.status,
    tournament_date=excluded.tournament_date,
    tournament_password=excluded.tournament_password,
    password_enabled=excluded.password_enabled,
    fixtures=excluded.fixtures,
    updated_at=now()
  returning * into v;
  return v;
end;
$$;

create or replace function public.tgs_delete_tournament(
  p_owner_user_id uuid,
  p_tournament_id bigint
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.tgs_tournaments
  where id=p_tournament_id and owner_user_id=p_owner_user_id;
  return found;
end;
$$;

grant execute on function public.tgs_register_user(text,text,text) to anon, authenticated;
grant execute on function public.tgs_login_user(text,text) to anon, authenticated;
grant execute on function public.tgs_list_tournaments(uuid) to anon, authenticated;
grant execute on function public.tgs_upsert_tournament(uuid,jsonb) to anon, authenticated;
grant execute on function public.tgs_delete_tournament(uuid,bigint) to anon, authenticated;
