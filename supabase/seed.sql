-- ============================================================================
-- OPTIONAL SEED DATA for Viom's Paradise
-- Run this after schema.sql on a FRESH project if you want it populated with
-- realistic starter content instead of building everything from the admin
-- dashboard from scratch.
--
-- If your project already has data from an older version of this seed (the
-- old multi-room hotel-style listings), run
-- supabase/migration_single_homestay.sql instead — it cleans up the old rooms
-- and adds the single homestay properly.
--
-- Note: room_images.storage_path and gallery_images.storage_path normally
-- hold a Supabase Storage path like "room-images/<file>.jpg". The frontend's
-- storageUrl() helper also accepts a full https:// URL directly (as used
-- below), so this seed works immediately without uploading any files —
-- swap these for real uploaded photos whenever you're ready.
-- ============================================================================

-- Viom's Paradise is booked as a single homestay unit (2 bedrooms + kitchen),
-- not separate hotel-style rooms — so this inserts exactly one row.
insert into public.rooms (slug, name, short_description, description, price_per_night, max_guests, bed_config, size_sqft, amenities, is_active, is_featured, total_units, sort_order)
values
  ('vioms-paradise-homestay', 'Viom''s Paradise Homestay',
   'A peaceful private homestay with 2 bedrooms and a full kitchen, all to yourselves.',
   'Viom''s Paradise is a private homestay tucked among the tea gardens and forested foothills near Siliguri — not a hotel, and not a shared property. When you book, the entire home is yours: two comfortable bedrooms, a full kitchen for cooking your own meals, and a living space that opens out to the hills.',
   6500, 6, '2 Bedrooms (1 King + 2 Twin)', 900,
   array['2 Bedrooms','Full Kitchen','Bathroom','Free Wi-Fi','Parking','Hot Water','Mountain & Garden View','Family Friendly','Clean & Comfortable Stay','Power Backup'],
   true, true, 1, 1)
on conflict (slug) do nothing;

insert into public.room_images (room_id, storage_path, is_cover, sort_order)
select id, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop', true, 1 from public.rooms where slug = 'vioms-paradise-homestay'
union all
select id, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1600&auto=format&fit=crop', false, 2 from public.rooms where slug = 'vioms-paradise-homestay'
union all
select id, 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1600&auto=format&fit=crop', false, 3 from public.rooms where slug = 'vioms-paradise-homestay';

insert into public.faqs (question, answer, sort_order) values
  ('Is food service available at Viom''s Paradise?', 'Viom''s Paradise is a self-catered homestay with a full kitchen, so there''s no in-house restaurant. Our website also has a built-in restaurant finder if you''d rather eat out.', 1),
  ('What are the check-in and check-out times?', 'Standard check-in is from 1:00 PM and check-out is by 11:00 AM. Early check-in or late check-out can be requested subject to availability.', 2),
  ('How do I pay for my booking?', 'All bookings are paid securely online via Razorpay, supporting UPI, credit/debit cards, net banking, and wallets.', 3),
  ('What is the cancellation policy?', 'Cancellations more than 72 hours before check-in receive a full refund. See our Cancellation Policy page for details.', 4)
on conflict do nothing;

insert into public.attractions (name, description, distance_km, storage_path, sort_order) values
  ('Mahananda Wildlife Sanctuary', 'Dense sal forest home to elephants, leopards, and over 200 bird species.', 8, 'https://images.unsplash.com/photo-1549366021-9f761d450615?q=80&w=1200&auto=format&fit=crop', 1),
  ('Sevoke Coronation Bridge', 'A historic stone bridge over the Teesta River, framed by forested hills.', 12, 'https://images.unsplash.com/photo-1600100397608-f9dc4f8a4c4b?q=80&w=1200&auto=format&fit=crop', 2),
  ('Darjeeling Himalayan Railway', 'The UNESCO-listed "Toy Train" through the tea-covered hillsides.', 45, 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?q=80&w=1200&auto=format&fit=crop', 3),
  ('Local Tea Estate Walks', 'Guided morning walks through working tea gardens neighbouring the property.', 2, 'https://images.unsplash.com/photo-1563822249366-604ef53ba7f4?q=80&w=1200&auto=format&fit=crop', 4)
on conflict do nothing;

insert into public.gallery_categories (name, sort_order) values
  ('Exterior', 1), ('Bedroom 1', 2), ('Bedroom 2', 3), ('Kitchen', 4), ('Bathroom', 5), ('Surroundings', 6)
on conflict (name) do nothing;
