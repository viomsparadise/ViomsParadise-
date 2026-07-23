# Viom's Paradise — Luxury Home Stay Booking Platform

A production-grade booking platform for a luxury home stay: public marketing site, room browsing,
online booking with Razorpay payments, customer accounts, and a full admin dashboard — built on
React + TypeScript + Vite + Tailwind, with Supabase (Postgres/Auth/Storage) as the backend.

> **Food Service is Not Available.** Viom's Paradise is a self-catered property; this is surfaced
> throughout the site (home, rooms, room details, footer, terms, and booking confirmation) per the
> business requirement.

---

## 1. What's fully built vs. what to extend

This is a real, working codebase — not placeholders — but it's honest to say what's deep vs. what's
a solid, ready-to-extend foundation:

**Fully built, end-to-end:**
- Public site: Home, About, Rooms, Room Details, Gallery (with lightbox), Reviews (public + submit),
  Nearby Attractions, FAQ, Contact (with DB-backed form), all 3 legal pages
- Auth: sign up, sign in, forgot/reset password, email verification (via Supabase Auth), session
  management, protected routes
- Booking flow: date/guest selection → availability check → price breakdown → Razorpay checkout →
  server-verified payment → confirmation page → booking appears in customer dashboard
- Customer dashboard: overview, booking history, cancel-per-policy, profile editing
- Admin dashboard: overview/analytics, full Room CRUD with image upload, Booking management
  (search/filter/status actions/CSV export/print), Payment log, Availability blackout dates, Gallery
  manager, Review moderation, Customer list, Revenue & Booking analytics, Website Settings (drives
  the whole public site), System Logs
- Complete Postgres schema with RLS on every table, triggers (booking refs, double-booking
  prevention), views, and Storage bucket policies
- Two Supabase Edge Functions that do the *actual* secure Razorpay integration (order creation +
  HMAC signature verification) so the payment amount and confirmation can never be spoofed from the
  browser

**Solid but intentionally lean (extend using the same patterns already in the code):**
- Refunds are logged/tracked in the admin Payments screen, but *issuing* a Razorpay refund still
  needs one more Edge Function (`refund-payment`) calling Razorpay's `/refunds` API — the pattern to
  copy is exactly `verify-razorpay-payment/index.ts`.
- Email sending (booking confirmation emails) is not wired up — Supabase Auth handles verification
  and password-reset emails out of the box, but a "booking confirmed" email needs a provider (Resend,
  Postmark, etc.) called from another small Edge Function triggered on the `bookings` update.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (custom luxury design tokens) + hand-built shadcn-pattern components |
| Animation | Framer Motion |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Payments | Razorpay (Checkout.js + server-side order creation & signature verification) |
| Hosting | Vercel (or any static host + Supabase project) |

---

## 3. Local setup

```bash
npm install
cp .env.example .env
# fill in .env with your Supabase project URL/anon key and Razorpay key id
npm run dev
```

### 3.1 Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run **`supabase/schema.sql`** — this creates every table, RLS policy, trigger,
   view, and storage bucket the app needs.
3. (Optional but recommended for a populated demo) Run **`supabase/seed.sql`** to add four rooms,
   FAQs, attractions, and gallery categories with hosted placeholder photography, so the site looks
   complete on day one. Replace these with real photos via the admin Gallery/Rooms screens whenever
   you're ready.
4. Copy your Project URL and `anon` public key into `.env` as `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY`.

### 3.2 Enable Phone OTP sign-in (required for bookings)

Guests verify a phone number with a one-time SMS code instead of creating an email/password
account. This needs an SMS provider connected to Supabase — it is **not free** and Supabase does
not include one by default:

1. Supabase Dashboard → **Authentication → Sign In / Providers → Phone** → toggle **ON**
2. Same page → **SMS Provider** → connect **Twilio**, **MSG91**, **Vonage**, or another supported
   provider using your own account and API credentials
3. If you already ran `schema.sql` before this feature was added, also run
   **`supabase/migration_phone_auth.sql`** once in the SQL Editor

### 3.3 Make yourself an admin

Admin access is role-based via the `admin_users` table — **not** a hardcoded email. After you sign up
through the site once (so a row exists in `auth.users`), run in the SQL Editor:

```sql
insert into public.admin_users (user_id, role)
values ('<your-auth-user-id>', 'super_admin');
```

You'll find your user id in Supabase → Authentication → Users. Then sign in at `/admin/login`.

### 3.3 Deploy the Edge Functions (required for payments to work)

The two functions in `supabase/functions/` do the secure part of the Razorpay integration — the
amount charged is looked up server-side from the `bookings` table, and the payment signature is
verified server-side, so neither can be tampered with from the browser.

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>

supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
supabase secrets set RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx

supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

### 3.4 Razorpay account

1. Create an account at [razorpay.com](https://razorpay.com) and grab your test-mode Key ID/Secret
   from Settings → API Keys.
2. Put the **Key ID only** in the frontend `.env` as `VITE_RAZORPAY_KEY_ID` (the secret key must never
   go in frontend env vars — it only lives in Supabase Edge Function secrets, step 3.3 above).
3. Test payments with Razorpay's [test card/UPI numbers](https://razorpay.com/docs/payments/payments/test-card-upi-details/).
4. Switch to live keys (and re-run `supabase secrets set` / update `.env`) when you're ready to accept
   real payments.

---

## 4. Project structure

```
src/
  components/
    layout/       Navbar, Footer, PageHeader, FoodServiceNotice, FloatingContact, etc.
    home/          Home page sections
    rooms/         RoomCard
    booking/       PriceBreakdown
    gallery/       Lightbox
    admin/         Shared admin UI (stat cards, section headers)
    ui/            Hand-built shadcn-pattern primitives (button, card, dialog, tabs, ...)
  pages/           One file per route (public, auth/, dashboard/, admin/)
  hooks/           Data hooks — each fetches from Supabase with graceful demo-content fallback
  context/         AuthContext (session, profile, isAdmin, auth actions)
  lib/             supabase client, database types, razorpay client helper, utils
  data/            Fallback/demo content shown before the admin adds real data
  routes/          ProtectedRoute (customer) / AdminRoute (admin_users-gated)
supabase/
  schema.sql       Full DB schema, RLS, triggers, views, storage policies
  seed.sql         Optional starter content
  functions/       Edge Functions for secure Razorpay order + verification
```

### Why hooks fall back to demo content

Every content hook (`useRooms`, `useAttractions`, `useFaqs`, `useGallery`, `useApprovedReviews`)
queries Supabase first and only falls back to the bundled demo content in `src/data/demoContent.ts`
if the table is empty — so the site never looks broken or empty before you've added real data, but
real data always wins the moment it exists.

---

## 5. Design system

The visual identity is grounded in the actual setting — an Eastern Himalayan foothill / tea-garden
home stay near Siliguri — rather than a generic villa template:

- **Palette:** deep forest green, moss, warm sand, antique gold, and a restrained ember accent
  (`tailwind.config.ts` → `theme.extend.colors`)
- **Type:** Fraunces (display) paired with Manrope (body/UI)
- **Signature motif:** an animated "canopy line" (tea-row/hillside silhouette) in the footer

---

## 6. Deploying to Vercel

```bash
vercel
```

Add the same environment variables from `.env` in the Vercel project settings
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID`, `VITE_WHATSAPP_NUMBER`,
`VITE_PHONE_NUMBER`). `vercel.json` is already configured for SPA routing.

---

## 7. Security notes

- Every table has Row Level Security enabled; policies are defined explicitly per table in
  `schema.sql` (guests see only their own bookings/payments, admins are gated via `admin_users`).
- The Razorpay **key secret** never touches the frontend — it lives only in Supabase Edge Function
  secrets, and payment verification (HMAC signature check) happens server-side.
- A booking only ever moves to `confirmed` after the Edge Function verifies the Razorpay signature —
  never from a client-side "success" callback alone.
- A Postgres trigger (`check_room_availability`) enforces no-double-booking at the database level as
  a backstop to the application-level availability check.
