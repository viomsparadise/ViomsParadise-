-- ============================================================================
-- MIGRATION: Fix rooms_public SECURITY DEFINER view
-- Run once in Supabase SQL Editor. Safe to re-run.
--
-- Problem: The view was implicitly created with SECURITY DEFINER, meaning it
-- runs as the view owner (postgres/superuser) and bypasses RLS on the
-- underlying `rooms` table.
--
-- Fix: Recreate with SECURITY INVOKER so the querying user's permissions and
-- RLS policies are respected.
-- ============================================================================
-- Drop the existing view
DROP VIEW IF EXISTS public.rooms_public;
CREATE VIEW public.rooms_public
WITH (security_invoker = true)
AS
SELECT
  r.*,
  (
    SELECT storage_path FROM public.room_images ri
    WHERE ri.room_id = r.id AND ri.is_cover = true LIMIT 1
  ) AS cover_image,
  COALESCE(
    (SELECT ROUND(AVG(rv.rating)::numeric, 1) FROM public.reviews rv
     WHERE rv.room_id = r.id AND rv.is_approved = true), 0
  ) AS avg_rating,
  COALESCE(
    (SELECT COUNT(*) FROM public.reviews rv
     WHERE rv.room_id = r.id AND rv.is_approved = true), 0
  ) AS review_count
FROM public.rooms r
WHERE r.is_active = true;
GRANT SELECT ON public.rooms_public TO anon, authenticated;