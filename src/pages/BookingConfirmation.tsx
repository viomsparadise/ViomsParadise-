import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Download, Loader2, CalendarDays, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NearbyRestaurants } from "@/components/shared/NearbyRestaurants";
import { supabase } from "@/lib/supabase";
import { formatDate, formatINR, nightsBetween } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { Database } from "@/lib/database.types";

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & { rooms?: { name: string; slug: string } };

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const { settings } = useSiteSettings();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!bookingId) return;
    const id = bookingId; // captured as a plain string so nested closures don't lose the narrowing
    let active = true;

    async function load() {
      const { data } = await supabase.from("bookings").select("*, rooms(name, slug)").eq("id", id).single();
      if (!active) return;
      if (data && data.status === "confirmed") {
        setBooking(data as Booking);
        setLoading(false);
      } else if (attempts < 6) {
        // The webhook/edge-function verification can take a couple of seconds — poll briefly.
        setTimeout(() => setAttempts((a) => a + 1), 1500);
      } else {
        setBooking(data ? (data as Booking) : null);
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [bookingId, attempts]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ivory pt-24 text-forest-900/60">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Confirming your booking…</p>
      </div>
    );
  }

  if (!booking || booking.status !== "confirmed") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ivory pt-24 text-center">
        <p className="font-display text-2xl text-forest-900">We couldn't confirm this booking yet</p>
        <p className="max-w-sm text-sm text-forest-900/60">
          If your payment succeeded, this page will update shortly. You can also check{" "}
          <Link to="/dashboard/bookings" className="underline">My Bookings</Link>.
        </p>
      </div>
    );
  }

  const nights = nightsBetween(booking.check_in, booking.check_out);

  return (
    <div className="min-h-screen bg-forest-950 pb-20 pt-32 text-ivory">
      <div className="container-luxe max-w-2xl">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15">
            <CheckCircle2 className="h-9 w-9 text-gold" />
          </div>
          <h1 className="mt-6 font-display text-3xl sm:text-4xl">Booking Confirmed</h1>
          <p className="mt-2 text-ivory/60">
            {booking.guest_email ? `A confirmation has been sent to ${booking.guest_email}` : "Save your booking reference below for your records."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          id="booking-confirmation-card"
          className="mt-10 overflow-hidden rounded-2xl border border-ivory/10 bg-ivory text-forest-900 shadow-luxury"
        >
          <div className="flex items-center justify-between bg-sand-100 px-8 py-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-forest-900/50">Booking Reference</p>
              <p className="font-display text-xl">{booking.booking_reference}</p>
            </div>
            <span className="rounded-full bg-forest-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ivory">Confirmed</span>
          </div>

          <div className="space-y-5 p-8">
            <div>
              <p className="font-display text-lg">{booking.rooms?.name}</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-forest-900/50">
                <MapPin className="h-3.5 w-3.5" /> {settings.address}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl bg-sand-100 p-5 text-sm sm:grid-cols-4">
              <div>
                <p className="flex items-center gap-1 text-xs text-forest-900/50"><CalendarDays className="h-3.5 w-3.5" /> Check-in</p>
                <p className="mt-1 font-semibold">{formatDate(booking.check_in)}</p>
                <p className="text-xs text-forest-900/40">from {settings.check_in_time}</p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-xs text-forest-900/50"><CalendarDays className="h-3.5 w-3.5" /> Check-out</p>
                <p className="mt-1 font-semibold">{formatDate(booking.check_out)}</p>
                <p className="text-xs text-forest-900/40">by {settings.check_out_time}</p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-xs text-forest-900/50"><Users className="h-3.5 w-3.5" /> Guests</p>
                <p className="mt-1 font-semibold">{booking.num_guests}</p>
              </div>
              <div>
                <p className="text-xs text-forest-900/50">Nights</p>
                <p className="mt-1 font-semibold">{nights}</p>
              </div>
            </div>

            <div className="flex justify-between border-t border-forest-900/10 pt-5">
              <span className="text-sm text-forest-900/60">Amount Paid</span>
              <span className="font-display text-xl">{formatINR(booking.total_amount)}</span>
            </div>

            <p className="flex items-center gap-2 rounded-lg bg-gold/10 px-4 py-3 text-xs text-forest-800">
              Planning meals? <NearbyRestaurants variant="compact" className="font-semibold" />
            </p>
          </div>
        </motion.div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="gold" size="lg" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Download / Print Confirmation
          </Button>
          <Link to="/dashboard/bookings">
            <Button variant="outlineLight" size="lg" className="w-full">View My Bookings</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
