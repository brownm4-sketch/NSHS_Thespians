-- Migration: add a throwaway keepalive table that the daily GitHub Actions
-- workflow writes to (not just reads from), to satisfy Supabase's free-tier
-- "sufficient activity" check. Fully isolated from the real app schema:
-- nothing in the site reads or writes this table, and there's no select
-- policy, so it's invisible to students/admins even via the API.
-- Safe to re-run.

create table if not exists public.keepalive_ping (
  id int primary key default 1,
  pinged_at timestamptz not null default now()
);

insert into public.keepalive_ping (id) values (1)
on conflict (id) do nothing;

alter table public.keepalive_ping enable row level security;

-- A select policy turns out to be required even though nothing reads this
-- table directly: Postgres' RLS + "INSERT ... ON CONFLICT DO UPDATE" needs
-- SELECT visibility on the existing row to detect the conflict at all, or
-- it denies the write outright ("new row violates row-level security
-- policy") instead of routing to the UPDATE path. The table holds nothing
-- sensitive (just a timestamp), so making it selectable is harmless.
drop policy if exists "keepalive_ping_select_public" on public.keepalive_ping;
create policy "keepalive_ping_select_public" on public.keepalive_ping
  for select using (true);

drop policy if exists "keepalive_ping_insert_anon" on public.keepalive_ping;
create policy "keepalive_ping_insert_anon" on public.keepalive_ping
  for insert with check (true);

drop policy if exists "keepalive_ping_update_anon" on public.keepalive_ping;
create policy "keepalive_ping_update_anon" on public.keepalive_ping
  for update using (true) with check (true);

grant insert, update on public.keepalive_ping to anon, authenticated;
