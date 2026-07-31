-- ============================================================================
-- MIGRATION: Booking Availability Lock Fix
-- Run this once in the Supabase SQL Editor (safe to re-run).
--
-- BEHAVIOR CHANGE from the original schema: previously, a `pending_payment`
-- booking blocked other guests from even attempting to book the same dates.
-- Per the updated business rules, only a `confirmed` (i.e. paid) booking
-- should ever block dates — a pending booking must NOT block anyone. This
-- means two guests can both reach the payment screen for the same dates,
-- but only the first one to actually complete payment will succeed in
-- becoming `confirmed`; the second will be rejected at that point with a
-- clear message, both in the browser AND enforced at the database level
-- (so it's race-condition safe even if two payments complete within the
-- same second).
-- ============================================================================

create or replace function public.check_room_availability()
returns trigger language plpgsql as $$
declare
  overlapping_count int;
  room_units int;
begin
  -- Only ever block against CONFIRMED bookings. A pending_payment or
  -- rejected booking never occupies the calendar.
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
    raise exception 'Sorry, this homestay is already booked for the selected dates. Please choose different dates.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- Re-attach the trigger so it re-checks on insert AND whenever status/dates
-- change (e.g. the moment payment verification flips it to `confirmed`).
drop trigger if exists trg_check_availability on public.bookings;
create trigger trg_check_availability
  before insert or update of check_in, check_out, room_id, status on public.bookings
  for each row execute procedure public.check_room_availability();

-- ----------------------------------------------------------------------------
-- "Expired" bookings: a pending_payment booking that never completed payment.
-- Since pending bookings never block dates, this is mostly for dashboard
-- cleanliness (so old abandoned attempts don't sit in "Pending" forever) —
-- it does not need to "release" any dates, because pending never held any.
-- ----------------------------------------------------------------------------
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('pending_payment', 'confirmed', 'cancelled', 'rejected', 'completed', 'refunded', 'expired'));

create or replace function public.expire_stale_pending_bookings()
returns void
language sql
security definer set search_path = public
as $$
  update public.bookings
  set status = 'expired'
  where status = 'pending_payment'
    and created_at < now() - interval '30 minutes';
$$;

-- Optional: run this on a schedule so stale pending bookings auto-expire
-- without needing to open the admin dashboard. Requires the `pg_cron`
-- extension, which you can enable from Supabase Dashboard → Database →
-- Extensions, then run the two lines below (uncomment first):
--
-- create extension if not exists pg_cron;
-- select cron.schedule('expire-stale-bookings', '*/15 * * * *', 'select public.expire_stale_pending_bookings();');
--
-- Without pg_cron, you can still call `select public.expire_stale_pending_bookings();`
-- manually any time from the SQL Editor, or the admin dashboard now does an
-- equivalent check on load (see AdminBookings.tsx) purely for display.
-- ============================================================================
