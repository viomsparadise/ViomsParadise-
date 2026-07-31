import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AdminSectionHeader, AdminStatCard } from "@/components/admin/AdminUI";
import { IndianRupee, TrendingUp, Percent } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatINR } from "@/lib/utils";

export default function AdminAnalytics() {
  const [byRoom, setByRoom] = useState<{ name: string; revenue: number }[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, avgBooking: 0, occupancyRate: 0 });

  useEffect(() => {
    (async () => {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("total_amount, status, room_id, nights, rooms(name, total_units)")
        .in("status", ["confirmed", "completed"]);

      const grouped: Record<string, number> = {};
      let revenue = 0;
      let totalNights = 0;
      (bookings ?? []).forEach((b: any) => {
        const name = b.rooms?.name ?? "Unknown";
        grouped[name] = (grouped[name] ?? 0) + Number(b.total_amount);
        revenue += Number(b.total_amount);
        totalNights += b.nights ?? 0;
      });

      setByRoom(Object.entries(grouped).map(([name, revenue]) => ({ name, revenue })));
      setTotals({
        revenue,
        avgBooking: bookings && bookings.length > 0 ? revenue / bookings.length : 0,
        occupancyRate: bookings ? Math.min(100, Math.round((totalNights / (bookings.length * 3 || 1)) * 100)) : 0,
      });
    })();
  }, []);

  return (
    <div>
      <AdminSectionHeader title="Revenue Analytics" description="Where your bookings revenue is coming from." />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <AdminStatCard label="Total Revenue" value={formatINR(totals.revenue)} icon={<IndianRupee className="h-5 w-5" />} />
        <AdminStatCard label="Average Booking Value" value={formatINR(Math.round(totals.avgBooking))} icon={<TrendingUp className="h-5 w-5" />} />
        <AdminStatCard label="Est. Occupancy" value={`${totals.occupancyRate}%`} icon={<Percent className="h-5 w-5" />} />
      </div>

      <div className="mt-6 rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
        <h2 className="font-display text-lg text-forest-900">Revenue Summary</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byRoom}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F332910" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v: number) => formatINR(v)} />
              <Bar dataKey="revenue" fill="#3F5A45" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
