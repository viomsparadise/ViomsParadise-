-- ============================================================================
-- MIGRATION: Logo / Branding support
-- Run this once in the Supabase SQL Editor (safe to re-run).
-- ============================================================================

-- Default logo setting (empty = falls back to the text wordmark)
insert into public.site_settings (key, value) values
  ('logo_path', '""')
on conflict (key) do nothing;

-- Storage bucket for the logo (and any other branding assets)
insert into storage.buckets (id, name, public) values ('branding', 'branding', true)
  on conflict (id) do nothing;

drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select using (bucket_id in ('room-images','gallery','attractions','branding'));

drop policy if exists "storage_admin_write" on storage.objects;
create policy "storage_admin_write" on storage.objects
  for insert with check (
    bucket_id in ('room-images','gallery','attractions','branding') and public.is_admin(auth.uid())
  );
drop policy if exists "storage_admin_update" on storage.objects;
create policy "storage_admin_update" on storage.objects
  for update using (
    bucket_id in ('room-images','gallery','attractions','branding') and public.is_admin(auth.uid())
  );
drop policy if exists "storage_admin_delete" on storage.objects;
create policy "storage_admin_delete" on storage.objects
  for delete using (
    bucket_id in ('room-images','gallery','attractions','branding') and public.is_admin(auth.uid())
  );
