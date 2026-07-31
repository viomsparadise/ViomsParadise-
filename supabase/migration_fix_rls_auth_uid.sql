-- ============================================================================
-- MIGRATION: Fix RLS Initialization Plan
-- Run once in Supabase SQL Editor. Safe to re-run.
--
-- Problem: Every RLS policy in the schema calls auth.uid() as a bare
-- volatile function, which forces Postgres to re-evaluate it once per row
-- during a table scan — even though the current user never changes within
-- a single query.
--
-- Fix: Wrap every auth.uid() call in (select auth.uid()). This lets the
-- query planner treat it as a stable scalar — evaluated once per query
-- and reused across all rows — producing a significant speedup on any
-- table with many rows (bookings, system_logs, etc.).
--
-- No application code changes required. Behaviour is identical.
-- ============================================================================

-- ── PROFILES ─────────────────────────────────────────────────────────────────

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (
    (select auth.uid()) = id
    or public.is_admin((select auth.uid()))
  );

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (
    (select auth.uid()) = id
    or public.is_admin((select auth.uid()))
  );

-- ── ADMIN_USERS ───────────────────────────────────────────────────────────────

drop policy if exists "admin_users_select" on public.admin_users;
create policy "admin_users_select" on public.admin_users
  for select using (public.is_admin((select auth.uid())));

-- ── ROOMS ─────────────────────────────────────────────────────────────────────

drop policy if exists "rooms_public_read" on public.rooms;
create policy "rooms_public_read" on public.rooms
  for select using (is_active = true or public.is_admin((select auth.uid())));

drop policy if exists "rooms_admin_write" on public.rooms;
create policy "rooms_admin_write" on public.rooms
  for all
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- ── ROOM IMAGES ───────────────────────────────────────────────────────────────

drop policy if exists "room_images_admin_write" on public.room_images;
create policy "room_images_admin_write" on public.room_images
  for all
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- ── ROOM AVAILABILITY ─────────────────────────────────────────────────────────

drop policy if exists "availability_admin_write" on public.room_availability;
create policy "availability_admin_write" on public.room_availability
  for all
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- ── BOOKINGS ──────────────────────────────────────────────────────────────────

drop policy if exists "bookings_select_own_or_admin" on public.bookings;
create policy "bookings_select_own_or_admin" on public.bookings
  for select using (
    (select auth.uid()) = user_id
    or public.is_admin((select auth.uid()))
  );

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings
  for insert with check (
    (select auth.uid()) = user_id
    or public.is_admin((select auth.uid()))
  );

drop policy if exists "bookings_update_own_or_admin" on public.bookings;
create policy "bookings_update_own_or_admin" on public.bookings
  for update using (
    (select auth.uid()) = user_id
    or public.is_admin((select auth.uid()))
  );

-- ── PAYMENTS ──────────────────────────────────────────────────────────────────

drop policy if exists "payments_select_owner_or_admin" on public.payments;
create policy "payments_select_owner_or_admin" on public.payments
  for select using (
    public.is_admin((select auth.uid()))
    or exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "payments_admin_write" on public.payments;
create policy "payments_admin_write" on public.payments
  for all
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- ── GALLERY ───────────────────────────────────────────────────────────────────

drop policy if exists "gallery_categories_admin_write" on public.gallery_categories;
create policy "gallery_categories_admin_write" on public.gallery_categories
  for all
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

drop policy if exists "gallery_images_admin_write" on public.gallery_images;
create policy "gallery_images_admin_write" on public.gallery_images
  for all
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- ── REVIEWS ───────────────────────────────────────────────────────────────────

drop policy if exists "reviews_public_read_approved" on public.reviews;
create policy "reviews_public_read_approved" on public.reviews
  for select using (
    is_approved = true
    or public.is_admin((select auth.uid()))
    or (select auth.uid()) = user_id
  );

drop policy if exists "reviews_insert_authenticated" on public.reviews;
create policy "reviews_insert_authenticated" on public.reviews
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "reviews_admin_write" on public.reviews;
create policy "reviews_admin_write" on public.reviews
  for update using (public.is_admin((select auth.uid())));

drop policy if exists "reviews_admin_delete" on public.reviews;
create policy "reviews_admin_delete" on public.reviews
  for delete using (public.is_admin((select auth.uid())));

-- ── ATTRACTIONS ───────────────────────────────────────────────────────────────

drop policy if exists "attractions_public_read" on public.attractions;
create policy "attractions_public_read" on public.attractions
  for select using (is_active = true or public.is_admin((select auth.uid())));

drop policy if exists "attractions_admin_write" on public.attractions;
create policy "attractions_admin_write" on public.attractions
  for all
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- ── FAQS ──────────────────────────────────────────────────────────────────────

drop policy if exists "faqs_public_read" on public.faqs;
create policy "faqs_public_read" on public.faqs
  for select using (is_active = true or public.is_admin((select auth.uid())));

drop policy if exists "faqs_admin_write" on public.faqs;
create policy "faqs_admin_write" on public.faqs
  for all
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- ── CONTACT MESSAGES ─────────────────────────────────────────────────────────

drop policy if exists "contact_select_admin" on public.contact_messages;
create policy "contact_select_admin" on public.contact_messages
  for select using (public.is_admin((select auth.uid())));

drop policy if exists "contact_update_admin" on public.contact_messages;
create policy "contact_update_admin" on public.contact_messages
  for update using (public.is_admin((select auth.uid())));

-- ── SITE SETTINGS ─────────────────────────────────────────────────────────────

drop policy if exists "settings_admin_write" on public.site_settings;
create policy "settings_admin_write" on public.site_settings
  for all
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- ── SYSTEM LOGS ───────────────────────────────────────────────────────────────

drop policy if exists "logs_admin_only" on public.system_logs;
create policy "logs_admin_only" on public.system_logs
  for select using (public.is_admin((select auth.uid())));

drop policy if exists "logs_admin_insert" on public.system_logs;
create policy "logs_admin_insert" on public.system_logs
  for insert with check (public.is_admin((select auth.uid())));

-- ── STORAGE OBJECTS ───────────────────────────────────────────────────────────

drop policy if exists "storage_admin_write" on storage.objects;
create policy "storage_admin_write" on storage.objects
  for insert with check (
    bucket_id in ('room-images', 'gallery', 'attractions', 'branding')
    and public.is_admin((select auth.uid()))
  );

drop policy if exists "storage_admin_update" on storage.objects;
create policy "storage_admin_update" on storage.objects
  for update using (
    bucket_id in ('room-images', 'gallery', 'attractions', 'branding')
    and public.is_admin((select auth.uid()))
  );

drop policy if exists "storage_admin_delete" on storage.objects;
create policy "storage_admin_delete" on storage.objects
  for delete using (
    bucket_id in ('room-images', 'gallery', 'attractions', 'branding')
    and public.is_admin((select auth.uid()))
  );
