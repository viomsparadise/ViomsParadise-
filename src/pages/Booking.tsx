import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, Users, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { PriceBreakdown, usePriceBreakdown } from "@/components/booking/PriceBreakdown";
import { AvailabilityCalendar } from "@/components/booking/AvailabilityCalendar";
import { useRooms } from "@/hooks/useRooms";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { nightsBetween, formatINR, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import bookingHero from "@/assets/img/img1.jpg";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}
function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// Viom's Paradise is booked as a single homestay unit — guests reserve the
// whole property (2 bedrooms + kitchen), not an individual room. This page
// intentionally has no room picker: `rooms[0]` is simply "the homestay."
export default function Booking() {
  const navigate = useNavigate();
  const { rooms, loading: homestayLoading } = useRooms();
  const { settings } = useSiteSettings();
  const { user, profile } = useAuth();

  const homestay = rooms[0];

  const [checkIn, setCheckIn] = useState(addDaysISO(2));
  const [checkOut, setCheckOut] = useState(addDaysISO(4));
  const [guests, setGuests] = useState(2);
  const [guestName, setGuestName] = useState(profile?.full_name ?? "");
  const [guestEmail, setGuestEmail] = useState(user?.email ?? "");
  const [guestPhone, setGuestPhone] = useState(profile?.phone ?? "");
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.full_name) setGuestName(profile.full_name);
    if (profile?.phone) setGuestPhone(profile.phone);
    else if (user?.phone) setGuestPhone(user.phone);
    if (user?.email) setGuestEmail(user.email);
  }, [profile, user]);

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const { total } = usePriceBreakdown(homestay?.price_per_night ?? 0, nights);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!homestay) return setError("The homestay isn't available for booking right now — please check back shortly.");
    if (!checkIn || !checkOut) return setError("Please select your check-in and check-out dates on the calendar above.");
    if (new Date(checkOut) <= new Date(checkIn)) return setError("Check-out must be after check-in.");
    if (guests > homestay.max_guests) return setError(`The homestay comfortably sleeps up to ${homestay.max_guests} guests.`);
    if (!guestName || !guestPhone) return setError("Please fill in your name and phone number.");
    if (!user) return setError("Please sign in to complete your booking.");

    setSubmitting(true);
    try {
      // Availability check: since the whole homestay is one unit, any
      // overlapping CONFIRMED booking means those dates are taken. A
      // pending_payment booking never blocks anyone else — only a
      // successfully paid, confirmed booking does (the database enforces
      // this too, as a safety net against two people booking at once).
      const { data: overlapping, error: availError } = await supabase
        .from("bookings")
        .select("id")
        .eq("room_id", homestay.id)
        .eq("status", "confirmed")
        .lt("check_in", checkOut)
        .gt("check_out", checkIn);

      if (availError) throw availError;
      if ((overlapping?.length ?? 0) >= homestay.total_units) {
        setSubmitting(false);
        return setError("Sorry, this homestay is already booked for the selected dates. Please choose different dates.");
      }

      const subtotal = homestay.price_per_night * nights;
      const taxAmount = Math.round((subtotal * settings.tax_percent) / 100);
      const totalAmount = subtotal + taxAmount;

      const { data: booking, error: insertError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          room_id: homestay.id,
          guest_name: guestName,
          guest_email: guestEmail || "",
          guest_phone: guestPhone,
          check_in: checkIn,
          check_out: checkOut,
          num_guests: guests,
          room_price_per_night: homestay.price_per_night,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: 0,
          total_amount: totalAmount,
          special_requests: specialRequests || null,
          status: "pending_payment",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      navigate(`/payment/${booking.id}`);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong creating your booking.");
      toast.error("Could not create booking");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-24">
      <PageHeader
        eyebrow="Reserve Your Stay"
        title="Book the Homestay"
        description="You'll be booking the entire homestay — both bedrooms and the kitchen — just for your group."
        image={bookingHero}
      />

      <div className="container-luxe grid grid-cols-1 gap-12 py-16 lg:grid-cols-[1.3fr,1fr]">
        <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-8">
          {!user && (
            <div className="rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm text-forest-800">
              You'll need to <Link to="/verify-phone" state={{ from: "/booking" }} className="font-semibold underline">verify your phone number</Link> with a quick OTP to complete your booking.
            </div>
          )}

          {homestay && (
            <section className="flex items-center gap-4 rounded-xl border border-forest-900/10 bg-forest-900/[0.03] p-4">
              <img src={homestay.images[0]} alt={homestay.name} className="h-16 w-20 shrink-0 rounded-lg object-cover" />
              <div>
                <p className="font-display text-base text-forest-900">{homestay.name}</p>
                <p className="text-xs text-forest-900/50">{homestay.bed_config} · Up to {homestay.max_guests} guests · {formatINR(homestay.price_per_night)} / night</p>
              </div>
            </section>
          )}

          <section>
            <h2 className="font-display text-xl text-forest-900">Check-in & check-out</h2>
            <p className="mt-1 text-sm text-forest-900/50">
              Green dates are available, red dates are already booked or blocked. Tap a date to select check-in, then tap again for check-out.
            </p>
            <div className="mt-4">
              <AvailabilityCalendar
                roomId={homestay?.id}
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={(newCheckIn, newCheckOut) => {
                  setCheckIn(newCheckIn);
                  setCheckOut(newCheckOut);
                }}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label>Check-in Date</Label>
                <Input value={checkIn ? formatDate(checkIn) : "Select a date above"} readOnly className="mt-2 bg-forest-900/5" />
              </div>
              <div>
                <Label>Check-out Date</Label>
                <Input value={checkOut ? formatDate(checkOut) : "Select a date above"} readOnly className="mt-2 bg-forest-900/5" />
              </div>
              <div>
                <Label htmlFor="guests"><Users className="mr-1 inline h-3.5 w-3.5" /> Number of Guests</Label>
                <Input id="guests" type="number" min={1} max={homestay?.max_guests ?? 10} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="mt-2" required />
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl text-forest-900">Your details</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Guest Name</Label>
                <Input id="name" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input id="email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="mt-2" placeholder="For booking confirmation" />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="mt-2" required />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="requests">Special Requests (optional)</Label>
              <Textarea id="requests" value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} className="mt-2" placeholder="Early check-in, extra bedding, accessibility needs…" />
            </div>
          </section>

          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <Button type="submit" variant="gold" size="lg" className="w-full sm:w-auto" disabled={submitting || !user || homestayLoading}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Continue to Payment
          </Button>
        </motion.form>

        {/* Summary sidebar */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-forest-900/10 bg-white p-8 shadow-luxury">
            <h3 className="font-display text-lg text-forest-900">Booking Summary</h3>
            {homestay ? (
              <>
                <div className="mt-4 flex gap-3">
                  <img src={homestay.images[0]} alt={homestay.name} className="h-16 w-20 rounded-lg object-cover" />
                  <div>
                    <p className="font-display text-sm text-forest-900">{homestay.name}</p>
                    <p className="text-xs text-forest-900/50">{homestay.bed_config}</p>
                  </div>
                </div>
                <div className="mt-5 space-y-2 border-y border-forest-900/10 py-4 text-sm text-forest-900/70">
                  <div className="flex justify-between"><span>Check-in</span><span>{checkIn}</span></div>
                  <div className="flex justify-between"><span>Check-out</span><span>{checkOut}</span></div>
                  <div className="flex justify-between"><span>Nights</span><span>{nights}</span></div>
                  <div className="flex justify-between"><span>Guests</span><span>{guests}</span></div>
                </div>
                <div className="mt-4">
                  <PriceBreakdown pricePerNight={homestay.price_per_night} nights={nights} />
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-forest-900/50">Loading homestay pricing…</p>
            )}
            <p className="mt-6 text-center text-xs text-forest-900/40">
              You will not be charged until you complete payment on the next step. Total due: {homestay ? formatINR(total) : "—"}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
