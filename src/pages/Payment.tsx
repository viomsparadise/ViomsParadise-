import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { supabase } from "@/lib/supabase";
import { startRazorpayPayment } from "@/lib/razorpay";
import { formatDate, nightsBetween } from "@/lib/utils";
import type { Database } from "@/lib/database.types";
import { toast } from "sonner";

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & { rooms?: { name: string; slug: string } };

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    supabase
      .from("bookings")
      .select("*, rooms(name, slug)")
      .eq("id", bookingId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error("Booking not found");
          navigate("/rooms");
          return;
        }
        if (data.status === "confirmed") {
          navigate(`/booking-confirmation/${data.id}`);
          return;
        }
        setBooking(data as Booking);
        setLoading(false);
      });
  }, [bookingId, navigate]);

  async function handlePay() {
    if (!booking) return;
    setPaying(true);
    await startRazorpayPayment({
      bookingId: booking.id,
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      guestPhone: booking.guest_phone,
      onSuccess: () => {
        toast.success("Payment successful! Confirming your booking…");
        navigate(`/booking-confirmation/${booking.id}`);
      },
      onFailure: (msg) => {
        toast.error(msg);
        setPaying(false);
      },
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory pt-24">
        <Loader2 className="h-6 w-6 animate-spin text-forest-800" />
      </div>
    );
  }

  if (!booking) return null;

  const nights = nightsBetween(booking.check_in, booking.check_out);

  return (
    <div className="min-h-screen bg-sand-100 pt-32 pb-20">
      <div className="container-luxe max-w-2xl">
        <Link to={`/rooms/${booking.rooms?.slug ?? ""}`} className="flex items-center gap-2 text-sm text-forest-900/60 hover:text-forest-900">
          <ArrowLeft className="h-4 w-4" /> Back to room
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 overflow-hidden rounded-2xl border border-forest-900/10 bg-white shadow-luxury"
        >
          <div className="bg-forest-900 px-8 py-6 text-ivory">
            <p className="eyebrow text-gold">Secure Checkout</p>
            <h1 className="mt-1 font-display text-2xl">Confirm & Pay</h1>
          </div>

          <div className="p-8">
            <div className="flex items-center justify-between border-b border-forest-900/10 pb-5">
              <div>
                <p className="font-display text-lg text-forest-900">{booking.rooms?.name}</p>
                <p className="text-sm text-forest-900/50">
                  {formatDate(booking.check_in)} — {formatDate(booking.check_out)} · {nights} night{nights > 1 ? "s" : ""} · {booking.num_guests} guests
                </p>
              </div>
              <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-dark">
                Ref: {booking.booking_reference}
              </span>
            </div>

            <div className="py-6">
              <PriceBreakdown pricePerNight={booking.room_price_per_night} nights={nights} />
            </div>

            <div className="rounded-xl bg-forest-900/5 p-4 text-xs text-forest-900/60">
              <p className="flex items-center gap-2 font-semibold text-forest-900">
                <Lock className="h-3.5 w-3.5" /> Payments are processed securely by Razorpay
              </p>
              <p className="mt-1">We support UPI, Credit/Debit Cards, Net Banking, and Wallets. Your booking is confirmed only after payment succeeds.</p>
            </div>

            <Button onClick={handlePay} disabled={paying} variant="gold" size="lg" className="mt-8 w-full">
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Pay Securely Now
            </Button>
            <p className="mt-4 text-center text-xs text-forest-900/40">
              By continuing you agree to our{" "}
              <Link to="/terms-conditions" className="underline">Terms & Conditions</Link> and{" "}
              <Link to="/cancellation-policy" className="underline">Cancellation Policy</Link>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
