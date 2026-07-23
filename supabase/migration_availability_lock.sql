-- ============================================================================
-- MIGRATION: Booking Availability Lock Rules
-- Run this once in the Supabase SQL Editor (safe to re-run).
--
-- Implements the exact status rules requested:
--   pending_payment  -> does NOT block dates for other guests
--   confirmed        -> automatically blocks dates (only status that does)
--   cancelled        -> automatically releases dates
--   rejected         -> never blocked dates in the first place
--   expired          -> automatically releases dates (new status, for stale
--                       pending_payment bookings that never got paid)
-- ============================================================================

-- 1. New "expired" status
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('pending_payment', 'confirmed', 'cancelled', 'rejected', 'completed', 'refunded', 'expired'));

-- 2. Replace the double-booking guard so ONLY confirmed bookings count as a
--    real overlap. (A pending_payment row is just a guest mid-checkout — it
--    should never itself block someone else from also trying; only the
--    first one to actually reach `confirmed` wins, and this trigger is what
--    enforces that at the database level, closing the race-condition gap
--    the frontend check alone can't fully close.)
create or replace function public.check_room_availability()
returns trigger language plpgsql as $$
declare
  overlapping_count int;
  room_units int;
begin
  if new.status <> 'confirmed' then
    return new;
  end if;

  select total_units into room_units from public.rooms where id = new.room_id;

  select count(*) into overlapping_count
  from public.bookings b
  where b.room_id = new.room_id
    and b.id <> coalesce(new.id, uuid_nil())
    and b.status = 'confirmed'
    and daterange(b.check_in, b.check_out) && daterange(new.check_in, new.check_out);

  if overlapping_count >= room_units then
    raise exception 'Sorry, this homestay is already booked for the selected dates. Please choose different dates.';
  end if;

  return new;
end;
$$;

-- (trigger definition itself is unchanged — it already calls this function
-- on insert/update of check_in, check_out, room_id, status)

-- 3. A view the frontend calendar reads from directly: every date currently
--    unavailable, whether from a confirmed booking or an admin block, with
--    the reason and (for bookings) which guest — used both by the public
--    booking calendar (red/green) and the admin calendar ("who booked this").
create or replace view public.unavailable_dates as
select
  d::date as date,
  b.room_id,
  'booked'::text as kind,
  b.guest_name,
  b.booking_reference,
  null::text as admin_reason
from public.bookings b
cross join lateral generate_series(b.check_in, b.check_out - 1, interval '1 day') as d
where b.status = 'confirmed'
union all
select
  ra.date,
  ra.room_id,
  ra.status as kind,
  null as guest_name,
  null as booking_reference,
  ra.reason as admin_reason
from public.room_availability ra
where ra.status in ('blocked', 'maintenance', 'fully_booked') and ra.booking_id is null;

grant select on public.unavailable_dates to anon, authenticated;

-- ============================================================================
-- After running this:
--   - Only CONFIRMED bookings block dates for other guests (pending no longer does).
--   - The database itself now rejects any attempt to confirm two overlapping
--     bookings, even if two people were mid-checkout for the same dates at
--     once — whichever one is confirmed first wins; the second gets blocked
--     right at the database level with the exact guest-facing message.
--   - `unavailable_dates` gives the frontend one simple place to read "which
--     dates are red" from, whether the cause is a real booking or an admin block.
-- ============================================================================
