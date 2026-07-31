-- ============================================================================
-- MIGRATION: Auto-expire stale pending bookings
-- Run this once in the Supabase SQL Editor (safe to re-run).
--
-- A booking sitting in `pending_payment` for too long (guest abandoned
-- checkout, payment never completed) should eventually flip to `expired`
-- rather than sit there forever. Since pending bookings never block dates
-- anyway (see migration_availability_lock.sql), this is purely for keeping
-- Admin → Bookings clean and accurate — not a safety-critical release step.
-- ============================================================================

create or replace function public.expire_stale_bookings()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.bookings
  set status = 'expired'
  where status = 'pending_payment'
    and created_at < now() - interval '2 hours';
end;
$$;

-- Run it automatically every hour using pg_cron (enabled by default on most
-- Supabase projects — if this errors with "extension pg_cron does not
-- exist", go to Database → Extensions in the dashboard, enable "pg_cron",
-- then re-run just this last block below).
do $$
begin
  perform cron.schedule(
    'expire-stale-bookings-hourly',
    '0 * * * *', -- every hour, on the hour
    $$select public.expire_stale_bookings();$$
  );
exception when undefined_table or undefined_function then
  -- pg_cron isn't enabled on this project. You can still run
  -- `select public.expire_stale_bookings();` manually any time, or enable
  -- the pg_cron extension and re-run this migration to schedule it.
  null;
end $$;

-- ============================================================================
-- To run it manually right now instead of waiting for the schedule:
--   select public.expire_stale_bookings();
-- ============================================================================
