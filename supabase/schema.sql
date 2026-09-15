-- NSHS Thespian Society Tracker — Supabase schema + Row Level Security
-- Run this whole file once in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.

-- ============================================================
-- 1. Tables
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  graduation_year int,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Point catalog: the "role" list students pick from when logging a point entry.
-- scope='show' roles carry two point values (One Act vs Full Length); scope='officer'
-- roles carry one flat value (this is the TIPS "Officer" point category — a student
-- serving as troupe president, etc. — unrelated to site access/permissions).
-- Admin-editable; deactivate rather than delete so past log entries keep their
-- historical role reference.
create table if not exists public.point_roles (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('show', 'officer')),
  label text not null,
  points_one_act numeric,
  points_full_length numeric,
  points_flat numeric,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (scope, label)
);

-- Induction rank ladder, admin-editable. A member's rank is whichever row with the
-- highest min_points is still <= their total approved points.
create table if not exists public.rank_thresholds (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  min_points numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists public.point_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null
    check (category in ('one_act', 'full_length', 'officer', 'festival_event', 'advocacy', 'other')),
  role_id uuid references public.point_roles (id),
  production_title text not null default '',
  activity_date date not null,
  level text not null default '',
  hours numeric,
  base_points numeric not null default 0,
  bonus_points numeric not null default 0,
  total_points numeric generated always as (base_points + bonus_points) stored,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. Helper function (security definer avoids RLS recursion)
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- ============================================================
-- 3. New-user trigger: auto-create a profile row on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  grad_year int;
begin
  begin
    grad_year := nullif(new.raw_user_meta_data ->> 'graduation_year', '')::int;
  exception when others then
    grad_year := null;
  end;

  insert into public.profiles (id, email, full_name, graduation_year)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    grad_year
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 4. Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.point_roles enable row level security;
alter table public.rank_thresholds enable row level security;
alter table public.point_entries enable row level security;

-- profiles: students read their own row; admins read/update everyone
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());

-- point_roles: public readable (needed for the entry form + rank display), admin-managed
drop policy if exists "point_roles_select_public" on public.point_roles;
create policy "point_roles_select_public" on public.point_roles
  for select using (true);

drop policy if exists "point_roles_write_admin" on public.point_roles;
create policy "point_roles_write_admin" on public.point_roles
  for all using (public.is_admin()) with check (public.is_admin());

-- rank_thresholds: public readable, admin-managed
drop policy if exists "rank_thresholds_select_public" on public.rank_thresholds;
create policy "rank_thresholds_select_public" on public.rank_thresholds
  for select using (true);

drop policy if exists "rank_thresholds_write_admin" on public.rank_thresholds;
create policy "rank_thresholds_write_admin" on public.rank_thresholds
  for all using (public.is_admin()) with check (public.is_admin());

-- point_entries: students manage their own pending log; admins manage all
drop policy if exists "entries_select_own_or_admin" on public.point_entries;
create policy "entries_select_own_or_admin" on public.point_entries
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "entries_insert_own" on public.point_entries;
create policy "entries_insert_own" on public.point_entries
  for insert with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "entries_delete_own_pending" on public.point_entries;
create policy "entries_delete_own_pending" on public.point_entries
  for delete using (user_id = auth.uid() and status = 'pending');

drop policy if exists "entries_update_admin" on public.point_entries;
create policy "entries_update_admin" on public.point_entries
  for update using (public.is_admin());

-- ============================================================
-- 5. Seed data: the published TIPS point catalog + rank ladder
--    (admin-editable afterward from the Admin Panel)
-- ============================================================

insert into public.point_roles (scope, label, points_one_act, points_full_length, sort_order) values
  ('show', 'Acting-Major', 4, 8, 10),
  ('show', 'Acting-Minor', 3, 5, 20),
  ('show', 'Acting-Walk-on', 1, 2, 30),
  ('show', 'Acting-Chorus', 1, 3, 40),
  ('show', 'Acting-Dancer', 1, 3, 50),
  ('show', 'Acting-Understudy', 1, 2, 60),
  ('show', 'Technical-Stage Manager', 4, 8, 70),
  ('show', 'Technical-Stage Crew', 2, 4, 80),
  ('show', 'Technical-Lighting Technician', 3, 6, 90),
  ('show', 'Technical-Lighting Crew', 2, 3, 100),
  ('show', 'Technical-Set Designer', 4, 5, 110),
  ('show', 'Technical-Set Construction', 3, 5, 120),
  ('show', 'Technical-Costumer', 3, 6, 130),
  ('show', 'Technical-Costume Crew', 2, 5, 140),
  ('show', 'Technical-Properties Manager', 3, 5, 150),
  ('show', 'Technical-Properties Crew', 2, 3, 160),
  ('show', 'Technical-Sound Technician', 3, 5, 170),
  ('show', 'Technical-Sound Crew', 2, 3, 180),
  ('show', 'Technical-Makeup Manager', 3, 5, 190),
  ('show', 'Technical-Rehearsal Prompter', 2, 4, 200),
  ('show', 'Music-Pianist', 3, 6, 210),
  ('show', 'Music-Musicians', 2, 3, 220),
  ('show', 'Business-Business Manager', 4, 6, 230),
  ('show', 'Business-Business Crew', 2, 4, 240),
  ('show', 'Business-Publicity Manager', 3, 5, 250),
  ('show', 'Business-Publicity Crew', 2, 3, 260),
  ('show', 'Business-Ticket Manager', 2, 4, 270),
  ('show', 'Business-Ticket Crew', 1, 3, 280),
  ('show', 'Business-House Manager', 2, 4, 290),
  ('show', 'Business-House Crew', 1, 2, 300),
  ('show', 'Business-Usher', 1, 2, 310),
  ('show', 'Business-Programs', 1, 3, 320),
  ('show', 'Business-Program Crew', 1, 2, 330),
  ('show', 'Directing-Director', 4, 8, 340),
  ('show', 'Directing-Assistant Director', 3, 6, 350),
  ('show', 'Directing-Vocal Director', 3, 6, 360),
  ('show', 'Directing-Video Producer/Director', 3, 4, 370),
  ('show', 'Directing-Assistant Vocal Director', 2, 5, 380),
  ('show', 'Directing-Orchestra or Band Director', 3, 6, 390),
  ('show', 'Directing-Assistant Orchestra/Band Director', 2, 5, 400),
  ('show', 'Directing-Choreographer', 4, 7, 410),
  ('show', 'Directing-Assistant Choreographer', 3, 5, 420),
  ('show', 'Writing-Original Play (produced)', 5, 8, 430),
  ('show', 'Writing-Original Radio Script (produced)', 4, 6, 440),
  ('show', 'Writing-Original TV Script (produced)', 4, 6, 450),
  ('show', 'Writing-Original Play (unproduced)', 1, 2, 460),
  ('show', 'Writing-Original Radio Script (unproduced)', 0.5, 1.5, 470),
  ('show', 'Writing-Original TV Script (unproduced)', 0.5, 1.5, 480),
  ('show', 'Misc-Oral Interpretation', null, 2, 490),
  ('show', 'Misc-Duet Acting Scene', null, 2, 500),
  ('show', 'Misc-Participation (theatre festival/contest)', null, 3, 510),
  ('show', 'Other', null, null, 520)
on conflict (scope, label) do nothing;

insert into public.point_roles (scope, label, points_flat, sort_order) values
  ('officer', 'President', 6, 10),
  ('officer', 'Vice President', 4, 20),
  ('officer', 'Treasurer', 4, 30),
  ('officer', 'Secretary/Clerk', 5, 40),
  ('officer', 'Web Editor', 4, 50),
  ('officer', 'State Thespian Officer (STO)', 8, 60),
  ('officer', 'International Thespian Officer (ITO)', 10, 70)
on conflict (scope, label) do nothing;

insert into public.rank_thresholds (name, min_points) values
  ('Thespian', 10),
  ('Thespian (2-Star)', 20),
  ('Thespian (3-Star)', 30),
  ('Thespian (4-Star)', 40),
  ('Thespian (5-Star)', 50),
  ('Honor Thespian (6-Star)', 60),
  ('Honor Thespian (7-Star)', 70),
  ('Honor Thespian (8-Star)', 80),
  ('Honor Thespian (9-Star)', 90),
  ('Honor Thespian (10-Star)', 100),
  ('Honor Thespian (11-Star)', 110),
  ('National Honor Thespian (12-Star)', 120),
  ('National Honor Thespian (13-Star)', 130),
  ('National Honor Thespian (14-Star)', 140),
  ('National Honor Thespian (15-Star)', 150),
  ('National Honor Thespian (16-Star)', 160),
  ('National Honor Thespian (17-Star)', 170),
  ('International Honor Thespian', 180)
on conflict (name) do nothing;
