// Fallback content shown only when Supabase tables are empty (e.g. on first
// run, before the admin has added real photos/details through the dashboard).
// Real data always takes priority — see the hooks in src/hooks/.

export interface DemoRoom {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  price_per_night: number;
  max_guests: number;
  bed_config: string;
  size_sqft: number;
  amenities: string[];
  is_featured: boolean;
  total_units: number;
  images: string[];
  avg_rating: number;
  review_count: number;
}

// Viom's Paradise is booked as a single homestay unit (2 bedrooms + kitchen),
// not as separate hotel-style rooms. This array intentionally holds exactly
// one entry — the whole property — so a guest always books everything
// together. The admin edits this one record from Admin → Homestay Details.
export const DEMO_ROOMS: DemoRoom[] = [
  {
    id: "demo-homestay",
    slug: "vioms-paradise-homestay",
    name: "Viom's Paradise Homestay",
    short_description: "A peaceful private homestay with 2 bedrooms and a full kitchen, all to yourselves.",
    description:
      "Viom's Paradise is a private homestay tucked among the tea gardens and forested foothills near Siliguri — not a hotel, and not a shared property. When you book, the entire home is yours: two comfortable bedrooms, a full kitchen for cooking your own meals, and a living space that opens out to the hills. It's a quiet, family-friendly place to slow down, whether you're travelling with parents, kids, or old friends.",
    price_per_night: 6500,
    max_guests: 6,
    bed_config: "2 Bedrooms (1 King + 2 Twin)",
    size_sqft: 900,
    amenities: [
      "2 Bedrooms",
      "Full Kitchen",
      "Bathroom",
      "Free Wi-Fi",
      "Parking",
      "Hot Water",
      "Mountain & Garden View",
      "Family Friendly",
      "Clean & Comfortable Stay",
      "Power Backup",
    ],
    is_featured: true,
    total_units: 1,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1600&auto=format&fit=crop",
    ],
    avg_rating: 4.9,
    review_count: 41,
  },
];

export const DEMO_REVIEWS = [
  {
    id: "r1",
    guest_name: "Ananya R.",
    rating: 5,
    title: "Exactly the quiet we needed",
    comment:
      "We stayed for three nights and it was the reset we didn't know we needed. Having the whole place to ourselves, with a kitchen to cook in, made it feel like a real home away from home. Waking up to the tea gardens every morning is something I'm still thinking about.",
    room_name: "Viom's Paradise Homestay",
  },
  {
    id: "r2",
    guest_name: "Rohit & Meera",
    rating: 5,
    title: "Perfect for a family week",
    comment:
      "The two bedrooms and kitchen gave us the space to actually spend time together without being on top of each other. Our kids loved running around the garden. We cooked most of our own meals, which the kitchen made really easy.",
    room_name: "Viom's Paradise Homestay",
  },
  {
    id: "r3",
    guest_name: "Devika S.",
    rating: 5,
    title: "Genuinely peaceful",
    comment:
      "One of the most peaceful stays I've had. Quiet, clean, comfortable, and having the whole homestay to just two of us made it feel private and calm.",
    room_name: "Viom's Paradise Homestay",
  },
  {
    id: "r4",
    guest_name: "Kabir M.",
    rating: 4,
    title: "Lovely homestay, remember to plan meals",
    comment:
      "The homestay itself is lovely and the hosts were genuinely attentive. The kitchen was well stocked with basics but do carry your own groceries in, or use the restaurant search on the site to order in from town.",
    room_name: "Viom's Paradise Homestay",
  },
];

export const DEMO_ATTRACTIONS = [
  { id: "a1", name: "Mahananda Wildlife Sanctuary", description: "Dense sal forest home to elephants, leopards, and over 200 bird species.", distance_km: 8, image: "https://images.unsplash.com/photo-1549366021-9f761d450615?q=80&w=1200&auto=format&fit=crop" },
  { id: "a2", name: "Sevoke Coronation Bridge", description: "A historic stone bridge over the Teesta River, framed by forested hills.", distance_km: 12, image: "https://images.unsplash.com/photo-1600100397608-f9dc4f8a4c4b?q=80&w=1200&auto=format&fit=crop" },
  { id: "a3", name: "Darjeeling Himalayan Railway", description: "The UNESCO-listed 'Toy Train' through the tea-covered hillsides.", distance_km: 45, image: "https://images.unsplash.com/photo-1570789210967-2cac24afeb00?q=80&w=1200&auto=format&fit=crop" },
  { id: "a4", name: "Local Tea Estate Walks", description: "Guided morning walks through working tea gardens neighbouring the property.", distance_km: 2, image: "https://images.unsplash.com/photo-1563822249366-604ef53ba7f4?q=80&w=1200&auto=format&fit=crop" },
];

export const DEMO_FAQS = [
  { id: "f1", question: "Is food service available at Viom's Paradise?", answer: "Viom's Paradise is a self-catered homestay with a full kitchen, so there's no in-house restaurant — you're welcome to cook for yourselves. Our website also has a built-in restaurant finder if you'd rather eat out; just tap \"Search Nearby\" on the About or Attractions page." },
  { id: "f2", question: "What are the check-in and check-out times?", answer: "Standard check-in is from 1:00 PM and check-out is by 11:00 AM. Early check-in or late check-out can be requested and is subject to availability." },
  { id: "f3", question: "How do I pay for my booking?", answer: "All bookings are paid securely online at the time of reservation via Razorpay, which supports UPI, credit/debit cards, net banking, and wallets. Your booking is confirmed only after payment succeeds." },
  { id: "f4", question: "What is the cancellation policy?", answer: "Cancellations made more than 72 hours before check-in receive a full refund. Cancellations within 72 hours are subject to the charges outlined on our Cancellation Policy page." },
  { id: "f5", question: "Is the homestay suitable for families with children?", answer: "Yes — the whole homestay is booked as one unit, with two bedrooms and a kitchen, which makes it comfortable for families. Do reach out beforehand if you need an extra bed or cot." },
  { id: "f6", question: "Do you allow pets?", answer: "We evaluate pet stays on a case-by-case basis — please contact us directly before booking so we can confirm suitability for your dates." },
];

export const DEMO_GALLERY = [
  { id: "g1", category: "Exterior", storage_path: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop" },
  { id: "g2", category: "Exterior", storage_path: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=1200&auto=format&fit=crop" },
  { id: "g3", category: "Bedroom 1", storage_path: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1200&auto=format&fit=crop" },
  { id: "g4", category: "Bedroom 2", storage_path: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1200&auto=format&fit=crop" },
  { id: "g5", category: "Kitchen", storage_path: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200&auto=format&fit=crop" },
  { id: "g6", category: "Bathroom", storage_path: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop" },
  { id: "g7", category: "Surroundings", storage_path: "https://images.unsplash.com/photo-1563822249366-604ef53ba7f4?q=80&w=1200&auto=format&fit=crop" },
  { id: "g8", category: "Surroundings", storage_path: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=1200&auto=format&fit=crop" },
];
