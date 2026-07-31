-- ============================================================================
-- MIGRATION: Single Homestay Unit
-- Run this ONCE in the Supabase SQL Editor if your project already has the
-- old multi-room hotel-style listings (Canopy Suite, Forest Villa, Mist
-- Cottage, Heritage Room) from an earlier version of this site.
--
-- What this does:
-- 1. Deactivates the old rooms (is_active = false) so they stop appearing
--    anywhere on the public site. They are NOT deleted, because any existing
--    bookings/payments/reviews still reference them by room_id, and deleting
--    would break that history.
-- 2. Inserts a single new "Viom's Paradise Homestay" room representing the
--    whole property, which the site now treats as the one bookable unit.
-- 3. Renames the gallery categories to match a homestay layout.
--
-- Safe to run more than once.
-- ============================================================================

-- 1. Deactivate old multi-room listings (kept for booking-history integrity)
update public.rooms
set is_active = false, is_featured = false
where slug in ('canopy-suite', 'forest-villa', 'mist-cottage', 'heritage-room');

-- 2. Insert the single homestay unit (only if it doesn't already exist)
insert into public.rooms (slug, name, short_description, description, price_per_night, max_guests, bed_config, size_sqft, amenities, is_active, is_featured, total_units, sort_order)
values
  ('vioms-paradise-homestay', 'Viom''s Paradise Homestay',
   'A peaceful private homestay with 2 bedrooms and a full kitchen, all to yourselves.',
   'Viom''s Paradise is a private homestay tucked among the tea gardens and forested foothills near Siliguri — not a hotel, and not a shared property. When you book, the entire home is yours: two comfortable bedrooms, a full kitchen for cooking your own meals, and a living space that opens out to the hills.',
   6500, 6, '2 Bedrooms (1 King + 2 Twin)', 900,
   array['2 Bedrooms','Full Kitchen','Bathroom','Free Wi-Fi','Parking','Hot Water','Mountain & Garden View','Family Friendly','Clean & Comfortable Stay','Power Backup'],
   true, true, 1, 1)
on conflict (slug) do nothing;

-- 3. Rename gallery categories to a homestay layout (only if the old ones exist)
update public.gallery_categories set name = 'Exterior', sort_order = 1 where name = 'Rooms';
update public.gallery_categories set name = 'Surroundings', sort_order = 6 where name = 'Grounds';
update public.gallery_categories set name = 'Bathroom', sort_order = 5 where name = 'Nature';
update public.gallery_categories set name = 'Kitchen', sort_order = 4 where name = 'Interiors';

insert into public.gallery_categories (name, sort_order) values
  ('Bedroom 1', 2), ('Bedroom 2', 3)
on conflict (name) do nothing;

-- ============================================================================
-- After running this, go to Admin → Homestay Details to:
--   - upload real photos of the homestay (they'll attach to the new room)
--   - adjust the price, description, and amenities to match reality
--   - re-categorize any existing gallery photos into Exterior / Bedroom 1 /
--     Bedroom 2 / Kitchen / Bathroom / Surroundings from Admin → Gallery
-- ============================================================================
