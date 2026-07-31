import { Link } from "react-router-dom";
import { CalendarCheck, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyBookings } from "@/hooks/useMyBookings";
import { formatDate, formatINR, storageUrl } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function DashboardOverview() {
  const { profile } = useAuth();
  const { bookings, loading } = useMyBookings();

  const upcoming = bookings.filter((b) => b.status === "confirmed" && new Date(b.check_in) >= new Date());
  const totalStays = bookings.filter((b) => b.status === "confirmed" || b.status === "completed").length;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">My Account</p>
        <h1 className="mt-2 font-display text-3xl text-forest-900">Welcome back, {profile?.full_name?.split(" ")[0] || "Guest"}</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
          <CalendarCheck className="h-5 w-5 text-gold" />
          <p className="mt-4 font-display text-2xl text-forest-900">{upcoming.length}</p>
          <p className="text-xs text-forest-900/50">Upcoming stays</p>
        </div>
        <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
          <Clock className="h-5 w-5 text-gold" />
          <p className="mt-4 font-display text-2xl text-forest-900">{totalStays}</p>
          <p className="text-xs text-forest-900/50">Total stays booked</p>
        </div>
        <div className="rounded-2xl border border-forest-900/10 bg-forest-800 p-6 text-ivory shadow-soft">
          <p className="font-display text-lg">Plan your next stay</p>
          <Link to="/rooms"><Button variant="gold" size="sm" className="mt-4">Browse Rooms <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
        </div>
      </div>

      <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-forest-900">Upcoming Stay</h2>
          <Link to="/dashboard/bookings" className="text-sm text-forest-900/50 underline">View all</Link>
        </div>
        {loading ? (
          <p className="mt-6 text-sm text-forest-900/50">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="mt-6 text-sm text-forest-900/50">No upcoming stays yet. Time to plan one.</p>
        ) : (
          <div className="mt-6 flex items-center gap-4">
            <img
              src={
                upcoming[0].rooms?.room_images?.[0]?.storage_path
                  ? storageUrl(upcoming[0].rooms.room_images[0].storage_path)
                  : "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=400&auto=format&fit=crop"
              }
              alt=""
              className="h-20 w-24 rounded-xl object-cover"
            />
            <div>
              <p className="font-display text-lg text-forest-900">{upcoming[0].rooms?.name}</p>
              <p className="text-sm text-forest-900/60">{formatDate(upcoming[0].check_in)} — {formatDate(upcoming[0].check_out)}</p>
              <p className="text-sm font-semibold text-forest-900">{formatINR(upcoming[0].total_amount)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
