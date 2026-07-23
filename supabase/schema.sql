-- ============================================================================
-- VIOM'S PARADISE — Luxury Home Stay Booking Platform
-- Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor (or via `supabase db push`) on a fresh
-- project. Safe to re-run: guarded with IF NOT EXISTS / DROP ... IF EXISTS.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ============================================================================
-- 1. PROFILES  (extends auth.users)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_url text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- 2. ADMIN USERS  (role-based access — NOT hardcoded emails)
-- ============================================================================
create table if not exists public.admin_users (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('super_admin', 'admin', 'manager')),
  created_at timestamptz not null default now()
);

-- Helper used throughout RLS policies below
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admin_users a where a.user_id = uid);
$$;

-- ============================================================================
-- 3. ROOMS
-- ============================================================================
create table if not exists public.rooms (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  short_description text not null default '',
  description text not null default '',
  price_per_night numeric(10,2) not null check (price_per_night >= 0),
  max_guests int not null check (max_guests > 0),
  bed_config text default '1 King Bed',
  size_sqft int,
  amenities text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  total_units int not null default 1 check (total_units > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rooms_active on public.rooms (is_active);
create index if not exists idx_rooms_slug on public.rooms (slug);

create table if not exists public.room_images (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  storage_path text not null,
  alt_text text default '',
  sort_order int not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_room_images_room on public.room_images (room_id);

-- Blackout / manual availability overrides (holidays, maintenance, etc.)
create table if not exists public.room_availability (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  date date not null,
  units_blocked int not null default 1,
  reason text,
  created_at timestamptz not null default now(),
  unique (room_id, date)
);

-- ============================================================================
-- 4. BOOKINGS
-- ============================================================================
create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  booking_reference text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  room_id uuid not null references public.rooms(id),
  guest_name text not null,
  guest_email text not null default '',
  guest_phone text not null,
  check_in date not null,
  check_out date not null,
  num_guests int not null check (num_guests > 0),
  nights int not null,
  room_price_per_night numeric(10,2) not null,
  subtotal numeric(10,2) not null,
  tax_amount numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'confirmed', 'cancelled', 'rejected', 'completed', 'refunded', 'expired')),
  special_requests text,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_dates check (check_out > check_in)
);

create index if not exists idx_bookings_user on public.bookings (user_id);
create index if not exists idx_bookings_room on public.bookings (room_id);
create index if not exists idx_bookings_status on public.bookings (status);
create index if not exists idx_bookings_dates on public.bookings (room_id, check_in, check_out);

-- Auto-generate a human friendly booking reference, e.g. VP-2026-8F3K21
create or replace function public.generate_booking_reference()
returns text language sql as $$
  select 'VP-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 6));
$$;

create or replace function public.set_booking_reference()
returns trigger language plpgsql as $$
begin
  if new.booking_reference is null or new.booking_reference = '' then
    new.booking_reference := public.generate_booking_reference();
  end if;
  new.nights := (new.check_out - new.check_in);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_booking_reference on public.bookings;
create trigger trg_booking_reference
  before insert on public.bookings
  for each row execute procedure public.set_booking_reference();

drop trigger if exists trg_booking_touch on public.bookings;
create trigger trg_booking_touch
  before update on public.bookings
  for each row execute procedure public.set_booking_reference();

-- Prevent double-booking beyond available units at the DB level.
-- (Application layer also checks availability before creating a pending booking.)
create or replace function public.check_room_availability()
returns trigger language plpgsql as $$
declare
  overlapping_count int;
  room_units int;
begin
  -- Only CONFIRMED (paid) bookings ever block dates. A pending_payment
  -- booking must not prevent other guests from also attempting to book —
  -- only the first to actually complete payment succeeds; this trigger
  -- catches the race at confirmation time regardless.
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

drop trigger if exists trg_check_availability on public.bookings;
create trigger trg_check_availability
  before insert or update of check_in, check_out, room_id, status on public.bookings
  for each row execute procedure public.check_room_availability();

-- ============================================================================
-- 5. PAYMENTS
-- ============================================================================
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  razorpay_order_id text not null,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric(10,2) not null,
  currency text not null default 'INR',
  method text,
  status text not null default 'created'
    check (status in ('created', 'authorized', 'captured', 'failed', 'refunded')),
  refund_amount numeric(10,2) default 0,
  refund_id text,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_booking on public.payments (booking_id);
create index if not exists idx_payments_order on public.payments (razorpay_order_id);
create unique index if not exists idx_payments_payment_id on public.payments (razorpay_payment_id) where razorpay_payment_id is not null;

-- ============================================================================
-- 6. GALLERY
-- ============================================================================
create table if not exists public.gallery_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists public.gallery_images (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.gallery_categories(id) on delete set null,
  storage_path text not null,
  caption text,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_gallery_category on public.gallery_images (category_id);

-- ============================================================================
-- 7. REVIEWS
-- ============================================================================
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  guest_name text not null,
  rating int not null check (rating between 1 and 5),
  title text,
  comment text not null,
  is_approved boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_approved on public.reviews (is_approved);
create index if not exists idx_reviews_room on public.reviews (room_id);

-- ============================================================================
-- 8. NEARBY ATTRACTIONS
-- ============================================================================
create table if not exists public.attractions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null default '',
  distance_km numeric(5,1),
  storage_path text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- ============================================================================
-- 9. FAQ
-- ============================================================================
create table if not exists public.faqs (
  id uuid primary key default uuid_generate_v4(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- ============================================================================
-- 10. CONTACT MESSAGES
-- ============================================================================
create table if not exists public.contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 11. SITE SETTINGS  (single-row key/value config table drives the frontend)
-- ============================================================================
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value) values
  ('business_name', '"Viom''s Paradise"'),
  ('tagline', '"Experience Comfort, Nature, and Peace."'),
  ('phone_number', '"+91 99999 99999"'),
  ('whatsapp_number', '"919999999999"'),
  ('address', '"Viom''s Paradise, Near Sevoke Road, Siliguri, West Bengal, India"'),
  ('contact_email', '"stay@viomsparadise.com"'),
  ('google_maps_link', '"https://maps.google.com/?q=Siliguri,West+Bengal"'),
  ('food_service_available', 'false'),
  ('social_instagram', '""'),
  ('social_facebook', '""'),
  ('check_in_time', '"1:00 PM"'),
  ('check_out_time', '"11:00 AM"'),
  ('cancellation_free_hours', '72'),
  ('tax_percent', '12'),
  ('logo_path', '""')
on conflict (key) do nothing;

-- ============================================================================
-- 12. SYSTEM LOGS  (admin audit trail)
-- ============================================================================
create table if not exists public.system_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_logs_created on public.system_logs (created_at desc);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Public-facing room list with cover image + approved review stats
create or replace view public.rooms_public as
select
  r.*,
  (select storage_path from public.room_images ri where ri.room_id = r.id and ri.is_cover = true limit 1) as cover_image,
  coalesce((select round(avg(rv.rating)::numeric, 1) from public.reviews rv where rv.room_id = r.id and rv.is_approved = true), 0) as avg_rating,
  coalesce((select count(*) from public.reviews rv where rv.room_id = r.id and rv.is_approved = true), 0) as review_count
from public.rooms r
where r.is_active = true;

-- Revenue analytics (admin only, protected via the underlying table RLS)
create or replace view public.revenue_by_month as
select
  date_trunc('month', b.created_at)::date as month,
  count(*) filter (where b.status in ('confirmed','completed')) as bookings_count,
  sum(b.total_amount) filter (where b.status in ('confirmed','completed')) as revenue
from public.bookings b
group by 1
order by 1 desc;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.rooms enable row level security;
alter table public.room_images enable row level security;
alter table public.room_availability enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.gallery_categories enable row level security;
alter table public.gallery_images enable row level security;
alter table public.reviews enable row level security;
alter table public.attractions enable row level security;
alter table public.faqs enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings enable row level security;
alter table public.system_logs enable row level security;

-- PROFILES: users manage their own row; admins manage all
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin(auth.uid()));
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin(auth.uid()));

-- ADMIN_USERS: only admins can read; nobody can self-insert (managed via SQL/service role)
drop policy if exists "admin_users_select" on public.admin_users;
create policy "admin_users_select" on public.admin_users
  for select using (public.is_admin(auth.uid()));

-- ROOMS: public can read active rooms; admins can read/write everything
drop policy if exists "rooms_public_read" on public.rooms;
create policy "rooms_public_read" on public.rooms
  for select using (is_active = true or public.is_admin(auth.uid()));
drop policy if exists "rooms_admin_write" on public.rooms;
create policy "rooms_admin_write" on public.rooms
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ROOM IMAGES: public read, admin write
drop policy if exists "room_images_public_read" on public.room_images;
create policy "room_images_public_read" on public.room_images for select using (true);
drop policy if exists "room_images_admin_write" on public.room_images;
create policy "room_images_admin_write" on public.room_images
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ROOM AVAILABILITY: public read (needed for date-picker), admin write
drop policy if exists "availability_public_read" on public.room_availability;
create policy "availability_public_read" on public.room_availability for select using (true);
drop policy if exists "availability_admin_write" on public.room_availability;
create policy "availability_admin_write" on public.room_availability
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- BOOKINGS: guests see their own; admins see all; guests may insert their own booking
drop policy if exists "bookings_select_own_or_admin" on public.bookings;
create policy "bookings_select_own_or_admin" on public.bookings
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));
drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings
  for insert with check (auth.uid() = user_id or public.is_admin(auth.uid()));
drop policy if exists "bookings_update_own_or_admin" on public.bookings;
create policy "bookings_update_own_or_admin" on public.bookings
  for update using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- PAYMENTS: readable by the booking owner or admin; writes restricted to admin/service role
drop policy if exists "payments_select_owner_or_admin" on public.payments;
create policy "payments_select_owner_or_admin" on public.payments
  for select using (
    public.is_admin(auth.uid())
    or exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid())
  );
drop policy if exists "payments_admin_write" on public.payments;
create policy "payments_admin_write" on public.payments
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- GALLERY: public read, admin write
drop policy if exists "gallery_categories_public_read" on public.gallery_categories;
create policy "gallery_categories_public_read" on public.gallery_categories for select using (true);
drop policy if exists "gallery_categories_admin_write" on public.gallery_categories;
create policy "gallery_categories_admin_write" on public.gallery_categories
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "gallery_images_public_read" on public.gallery_images;
create policy "gallery_images_public_read" on public.gallery_images for select using (true);
drop policy if exists "gallery_images_admin_write" on public.gallery_images;
create policy "gallery_images_admin_write" on public.gallery_images
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- REVIEWS: public reads only approved; authenticated users can submit; admin manages all
drop policy if exists "reviews_public_read_approved" on public.reviews;
create policy "reviews_public_read_approved" on public.reviews
  for select using (is_approved = true or public.is_admin(auth.uid()) or auth.uid() = user_id);
drop policy if exists "reviews_insert_authenticated" on public.reviews;
create policy "reviews_insert_authenticated" on public.reviews
  for insert with check (auth.uid() = user_id);
drop policy if exists "reviews_admin_write" on public.reviews;
create policy "reviews_admin_write" on public.reviews
  for update using (public.is_admin(auth.uid()));
drop policy if exists "reviews_admin_delete" on public.reviews;
create policy "reviews_admin_delete" on public.reviews
  for delete using (public.is_admin(auth.uid()));

-- ATTRACTIONS / FAQS: public read active, admin write
drop policy if exists "attractions_public_read" on public.attractions;
create policy "attractions_public_read" on public.attractions for select using (is_active = true or public.is_admin(auth.uid()));
drop policy if exists "attractions_admin_write" on public.attractions;
create policy "attractions_admin_write" on public.attractions
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "faqs_public_read" on public.faqs;
create policy "faqs_public_read" on public.faqs for select using (is_active = true or public.is_admin(auth.uid()));
drop policy if exists "faqs_admin_write" on public.faqs;
create policy "faqs_admin_write" on public.faqs
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- CONTACT MESSAGES: anyone can insert (public contact form); only admin can read
drop policy if exists "contact_insert_public" on public.contact_messages;
create policy "contact_insert_public" on public.contact_messages for insert with check (true);
drop policy if exists "contact_select_admin" on public.contact_messages;
create policy "contact_select_admin" on public.contact_messages for select using (public.is_admin(auth.uid()));
drop policy if exists "contact_update_admin" on public.contact_messages;
create policy "contact_update_admin" on public.contact_messages for update using (public.is_admin(auth.uid()));

-- SITE SETTINGS: public read, admin write
drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read" on public.site_settings for select using (true);
drop policy if exists "settings_admin_write" on public.site_settings;
create policy "settings_admin_write" on public.site_settings
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- SYSTEM LOGS: admin only
drop policy if exists "logs_admin_only" on public.system_logs;
create policy "logs_admin_only" on public.system_logs for select using (public.is_admin(auth.uid()));
drop policy if exists "logs_admin_insert" on public.system_logs;
create policy "logs_admin_insert" on public.system_logs for insert with check (public.is_admin(auth.uid()));

-- ============================================================================
-- STORAGE BUCKETS  (run once; safe to re-run)
-- ============================================================================
insert into storage.buckets (id, name, public) values ('room-images', 'room-images', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('attractions', 'attractions', true)
  on conflict (id) do nothing;
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

-- ============================================================================
-- SEED: to make a user an admin, run (after they've signed up once):
-- insert into public.admin_users (user_id, role)
--   values ('<their-auth-uid>', 'super_admin');
-- ============================================================================
