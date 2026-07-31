-- ============================================================================
-- MIGRATION: Contact Email setting
-- Run this once in the Supabase SQL Editor (safe to re-run).
-- Adds a contact_email row so it can be edited from Admin → Website Settings
-- instead of being hardcoded on the site.
-- ============================================================================

insert into public.site_settings (key, value) values
  ('contact_email', '"stay@viomsparadise.com"')
on conflict (key) do nothing;
