import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { AdminSectionHeader, AdminStatCard } from "@/components/admin/AdminUI";
import { CalendarCheck, Clock, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const COLORS = ["#3F5A45", "#B08D57", "#A8492A", "#C6AE79", "#1F3329"];

export default function AdminBookingsAnalytics() {
  const [statusBreakdown, setStatusBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [trend, setTrend] = useState<{ day: string; bookings: number }[]>([]);
  const [avgLeadDays, setAvgLeadDays] = useState(0);
  const [cancelRate, setCancelRate] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("bookings").select("status, created_at, check_in");
      if (!data) return;

      const statusCounts: Record<string, number> = {};
      data.forEach((b) => (statusCounts[b.status] = (statusCounts[b.status] ?? 0) + 1));
      setStatusBreakdown(Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace("_", " "), value })));

      const byDay: Record<string, number> = {};
      data.forEach((b) => {
        const day = new Date(b.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        byDay[day] = (byDay[day] ?? 0) + 1;
      });
      setTrend(Object.entries(byDay).slice(-14).map(([day, bookings]) => ({ day, bookings })));

      const leadTimes = data.map((b) => (new Date(b.check_in).getTime() - new Date(b.created_at).getTime()) / (1000 * 60 * 60 * 24));
      setAvgLeadDays(leadTimes.length ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) : 0);

      const cancelled = data.filter((b) => b.status === "cancelled").length;
      setCancelRate(data.length ? Math.round((cancelled / data.length) * 100) : 0);
    })();
  }, []);

  return (
    <div>
      <AdminSectionHeader title="Booking Trends" description="Patterns in how and when guests book." />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <AdminStatCard label="Total Bookings" value={statusBreakdown.reduce((s, b) => s + b.value, 0)} icon={<CalendarCheck className="h-5 w-5" />} />
        <AdminStatCard label="Avg. Booking Lead Time" value={`${avgLeadDays} days`} icon={<Clock className="h-5 w-5" />} />
        <AdminStatCard label="Cancellation Rate" value={`${cancelRate}%`} icon={<XCircle className="h-5 w-5" />} accent="bg-ember/10 text-ember" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr,1fr]">
        <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg text-forest-900">Bookings Created (Last 14 Days)</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F332910" />
                <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="bookings" stroke="#B08D57" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg text-forest-900">Status Breakdown</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
