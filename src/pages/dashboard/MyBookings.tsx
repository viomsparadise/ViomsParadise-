import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Users, Download, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMyBookings } from "@/hooks/useMyBookings";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/lib/supabase";
import { formatDate, formatINR, nightsBetween } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default" | "outline"> = {
  confirmed: "success",
  pending_payment: "warning",
  cancelled: "danger",
  rejected: "danger",
  expired: "outline",
  completed: "outline",
  refunded: "outline",
};

export default function MyBookings() {
  const { bookings, loading, refetch } = useMyBookings();
  const { settings } = useSiteSettings();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  function hoursUntil(checkIn: string) {
    return (new Date(checkIn).getTime() - Date.now()) / (1000 * 60 * 60);
  }

  async function handleCancel(bookingId: string, checkIn: string) {
    const eligible = hoursUntil(checkIn) >= settings.cancellation_free_hours;
    const confirmMsg = eligible
      ? "Cancel this booking? You're within the free cancellation window and will receive a full refund."
      : `Cancel this booking? This is within ${settings.cancellation_free_hours} hours of check-in, so it is non-refundable per our Cancellation Policy.`;
    if (!window.confirm(confirmMsg)) return;

    setCancellingId(bookingId);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", cancellation_reason: eligible ? "Guest cancelled (within free window)" : "Guest cancelled (late — non-refundable)" })
      .eq("id", bookingId);
    setCancellingId(null);

    if (error) return toast.error("Could not cancel booking. Please contact us directly.");
    toast.success("Booking cancelled");
    refetch();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-forest-900">My Bookings</h1>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-forest-900/50">Loading your bookings…</p>
      ) : bookings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-forest-900/20 bg-white p-12 text-center">
          <p className="text-forest-900/60">You haven't made any bookings yet.</p>
          <Link to="/rooms"><Button variant="gold" className="mt-4">Browse Rooms</Button></Link>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {bookings.map((b) => {
            const nights = nightsBetween(b.check_in, b.check_out);
            const canCancel = b.status === "confirmed" && new Date(b.check_in) > new Date();
            return (
              <div key={b.id} className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-display text-lg text-forest-900">{b.rooms?.name ?? "Room"}</p>
                      <Badge variant={STATUS_VARIANT[b.status] ?? "outline"}>{b.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-forest-900/40">Ref: {b.booking_reference}</p>
                  </div>
                  <p className="font-display text-xl text-forest-900">{formatINR(b.total_amount)}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-6 text-sm text-forest-900/60">
                  <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-gold" /> {formatDate(b.check_in)} — {formatDate(b.check_out)} ({nights}n)</span>
                  <span className="flex items-center gap-2"><Users className="h-4 w-4 text-gold" /> {b.num_guests} guests</span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {b.status === "confirmed" && (
                    <Link to={`/booking-confirmation/${b.id}`}>
                      <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" /> Confirmation</Button>
                    </Link>
                  )}
                  {b.status === "pending_payment" && (
                    <Link to={`/payment/${b.id}`}>
                      <Button variant="gold" size="sm">Complete Payment</Button>
                    </Link>
                  )}
                  {canCancel && (
                    <Button variant="outline" size="sm" onClick={() => handleCancel(b.id, b.check_in)} disabled={cancellingId === b.id}>
                      {cancellingId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />} Cancel Booking
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
