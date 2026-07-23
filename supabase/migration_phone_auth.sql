-- ============================================================================
-- MIGRATION: Switch guest auth from email/password to phone OTP
-- Run this once in your Supabase SQL Editor if you already ran schema.sql
-- before this change. Safe to re-run.
-- ============================================================================

-- Email is no longer required per booking (phone is now the primary identity)
alter table public.bookings alter column guest_email set default '';
alter table public.bookings alter column guest_email drop not null;
update public.bookings set guest_email = '' where guest_email is null;
alter table public.bookings alter column guest_email set not null;

-- Make sure new profiles also pick up the phone number used for OTP sign-in
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.raw_user_meta_data->>'phone', new.phone))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ============================================================================
-- MANUAL STEP (cannot be done via SQL): enable Phone auth
-- 1. Supabase Dashboard → Authentication → Sign In / Providers → Phone
--    → toggle it ON
-- 2. Authentication → Sign In / Providers → Phone → SMS Provider
--    → connect Twilio, MSG91, Vonage, or another supported provider with
--    your own account/API credentials (Supabase does not include free SMS)
-- 3. Optionally, Authentication → Settings → adjust OTP expiry/length
-- ============================================================================
