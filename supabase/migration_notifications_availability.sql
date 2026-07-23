-- ============================================================================
-- MIGRATION: Admin Notifications + Availability Statuses + Booking Notes
-- Run this once in the Supabase SQL Editor (safe to re-run).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references public.bookings(id) on delete cascade,
  booking_reference text not null,
  guest_name text not null,
  guest_phone text not null,
  guest_email text not null,
  check_in date not null,
  check_out date not null,
  num_guests int not null,
  total_amount numeric(10,2) not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_created on public.notifications (created_at desc);
create index if not exists idx_notifications_unread on public.notifications (is_read) where is_read = false;

alter table public.notifications enable row level security;

drop policy if exists "notifications_admin_select" on public.notifications;
create policy "notifications_admin_select" on public.notifications
  for select using (public.is_admin(auth.uid()));

drop policy if exists "notifications_admin_update" on public.notifications;
create policy "notifications_admin_update" on public.notifications
  for update using (public.is_admin(auth.uid()));

drop policy if exists "notifications_admin_delete" on public.notifications;
create policy "notifications_admin_delete" on public.notifications
  for delete using (public.is_admin(auth.uid()));

-- Notifications are only ever created by the trigger below (security definer),
-- never directly by a client, so there is intentionally no insert policy for
-- regular users — only the trigger function (which runs with elevated rights)
-- can write rows here.

-- Make the table available to Supabase Realtime so the admin badge/list
-- update instantly without a page refresh.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
exception when undefined_object then
  -- supabase_realtime publication doesn't exist in this project yet; skip.
  null;
end $$;

-- ----------------------------------------------------------------------------
-- 2. BOOKING NOTES (internal admin notes, never shown to guests)
-- ----------------------------------------------------------------------------
alter table public.bookings add column if not exists admin_notes text;

-- "rejected" is a new terminal status distinct from "cancelled" (guest-initiated)
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('pending_payment', 'confirmed', 'cancelled', 'rejected', 'completed', 'refunded'));

-- ----------------------------------------------------------------------------
-- 3. RICHER AVAILABILITY STATUSES
-- ----------------------------------------------------------------------------
alter table public.room_availability add column if not exists status text not null default 'blocked';
alter table public.room_availability drop constraint if exists room_availability_status_check;
alter table public.room_availability add constraint room_availability_status_check
  check (status in ('available', 'fully_booked', 'maintenance', 'blocked'));

-- Links an availability row back to the booking that auto-created it, so it
-- can be found and released precisely if that booking is cancelled/rejected.
alter table public.room_availability add column if not exists booking_id uuid references public.bookings(id) on delete cascade;

-- ----------------------------------------------------------------------------
-- 4. AUTO-BLOCK DATES WHEN A BOOKING IS CONFIRMED
--    AUTO-RELEASE DATES WHEN A BOOKING IS CANCELLED / REJECTED
--    CREATE AN ADMIN NOTIFICATION WHEN A BOOKING IS CONFIRMED
-- ----------------------------------------------------------------------------
create or replace function public.handle_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d date;
begin
  -- CONFIRMED (guest successfully booked & paid): block the date range + notify admin
  if new.status = 'confirmed' and (old.status is distinct from 'confirmed') then
    d := new.check_in;
    while d < new.check_out loop
      insert into public.room_availability (room_id, date, status, booking_id, units_blocked, reason)
      values (new.room_id, d, 'fully_booked', new.id, 1, 'Auto-blocked: booking ' || new.booking_reference)
      on conflict (room_id, date) do update
        set status = 'fully_booked', booking_id = new.id, reason = 'Auto-blocked: booking ' || new.booking_reference;
      d := d + interval '1 day';
    end loop;

    insert into public.notifications (
      booking_id, booking_reference, guest_name, guest_phone, guest_email,
      check_in, check_out, num_guests, total_amount
    ) values (
      new.id, new.booking_reference, new.guest_name, new.guest_phone, new.guest_email,
      new.check_in, new.check_out, new.num_guests, new.total_amount
    );
  end if;

  -- CANCELLED or REJECTED: release any dates this specific booking had auto-blocked
  if new.status in ('cancelled', 'rejected') and (old.status is distinct from new.status) then
    delete from public.room_availability
    where booking_id = new.id and status = 'fully_booked';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_booking_status_change on public.bookings;
create trigger trg_booking_status_change
  after update of status on public.bookings
  for each row execute procedure public.handle_booking_status_change();

-- A brand-new booking can occasionally be inserted directly with status =
-- 'confirmed' (e.g. an admin manually creating one) — cover that case too.
create or replace function public.handle_booking_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d date;
begin
  if new.status = 'confirmed' then
    d := new.check_in;
    while d < new.check_out loop
      insert into public.room_availability (room_id, date, status, booking_id, units_blocked, reason)
      values (new.room_id, d, 'fully_booked', new.id, 1, 'Auto-blocked: booking ' || new.booking_reference)
      on conflict (room_id, date) do update
        set status = 'fully_booked', booking_id = new.id, reason = 'Auto-blocked: booking ' || new.booking_reference;
      d := d + interval '1 day';
    end loop;

    insert into public.notifications (
      booking_id, booking_reference, guest_name, guest_phone, guest_email,
      check_in, check_out, num_guests, total_amount
    ) values (
      new.id, new.booking_reference, new.guest_name, new.guest_phone, new.guest_email,
      new.check_in, new.check_out, new.num_guests, new.total_amount
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_booking_insert_confirmed on public.bookings;
create trigger trg_booking_insert_confirmed
  after insert on public.bookings
  for each row execute procedure public.handle_booking_insert();

-- Need a unique constraint for the ON CONFLICT (room_id, date) above.
create unique index if not exists idx_room_availability_room_date on public.room_availability (room_id, date);

-- ============================================================================
-- After running this:
--   - The admin "Notifications" page and bell badge will populate the moment
--     a booking's status becomes "confirmed" (i.e. right after a guest pays).
--   - The Availability calendar will automatically show those dates as
--     "Fully Booked", and free them up again automatically if you cancel or
--     reject that booking from Admin → Bookings.
--   - Email notifications (optional) need one more step — see the new
--     `supabase/functions/notify-admin-email` Edge Function and its README
--     note about setting a RESEND_API_KEY secret.
-- ============================================================================
