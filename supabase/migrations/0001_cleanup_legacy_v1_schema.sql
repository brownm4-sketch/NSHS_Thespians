-- One-time cleanup for a Supabase project that had the original (pre-simplification)
-- schema applied — the version with officers/applications/announcements/gallery
-- tables and a profiles.role column. Run this once, then re-run the current
-- supabase/schema.sql to make sure policies, the is_admin() function, and the
-- point catalog/rank ladder seed data are all up to date.

-- Preserve anyone already marked admin under the old role system before dropping it.
alter table public.profiles add column if not exists is_admin boolean not null default false;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    update public.profiles set is_admin = true where role = 'admin';
    alter table public.profiles drop column role;
  end if;
end $$;

-- Drop tables from the earlier version of this project that are no longer used.
drop table if exists public.membership_applications cascade;
drop table if exists public.officers cascade;
drop table if exists public.announcements cascade;
drop table if exists public.gallery_images cascade;
drop table if exists public.site_content cascade;

-- Remove the unused gallery storage bucket, if one was created.
delete from storage.objects where bucket_id = 'gallery';
delete from storage.buckets where id = 'gallery';

-- Drop the old two-tier permission helper — is_admin() is redefined by schema.sql.
drop function if exists public.is_officer_or_admin();
