import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  IndianRupee, CalendarCheck, BedDouble, Star, ArrowUpRight, CalendarClock,
  LogIn, LogOut, Clock, XCircle, ListChecks,
} from "lucide-react";
import { AdminStatCard, AdminSectionHeader } from "@/components/admin/AdminUI";
import { supabase } from "@/lib/supabase";
import { formatINR, formatDate } from "@/lib/utils";

interface Stats {
  totalRevenue: number;
  totalBookings: number;
  todaysBookings: number;
  upcomingCheckins: number;
  upcomingCheckouts: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  activeRooms: number;
  pendingReviews: number;
  monthly: { month: string; revenue: number }[];
  recentBookings: any[];
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: bookings }, { data: rooms }, { data: reviews }, { data: monthly }, { data: recent }] = await Promise.all([
        supabase.from("bookings").select("total_amount, status, check_in, check_out, created_at"),
        supabase.from("rooms").select("id").eq("is_active", true),
        supabase.from("reviews").select("id").eq("is_approved", false),
        supabase.from("revenue_by_month").select("*").limit(6),
        supabase.from("bookings").select("id, guest_name, total_amount, status, check_in, rooms(name)").order("created_at", { ascending: false }).limit(5),
      ]);

      const all = bookings ?? [];
      const today = new Date().toISOString().split("T")[0];
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const confirmedOrCompleted = all.filter((b) => ["confirmed", "completed"].includes(b.status));
      const confirmedOnly = all.filter((b) => b.status === "confirmed");

      setStats({
        totalRevenue: confirmedOrCompleted.reduce((sum, b) => sum + Number(b.total_amount), 0),
        totalBookings: all.length,
        todaysBookings: all.filter((b) => new Date(b.created_at) >= todayStart).length,
        upcomingCheckins: confirmedOnly.filter((b) => b.check_in >= today).length,
        upcomingCheckouts: confirmedOnly.filter((b) => b.check_out >= today).length,
        pendingBookings: all.filter((b) => b.status === "pending_payment").length,
        confirmedBookings: confirmedOnly.length,
        cancelledBookings: all.filter((b) => ["cancelled", "rejected"].includes(b.status)).length,
        activeRooms: rooms?.length ?? 0,
        pendingReviews: reviews?.length ?? 0,
        monthly: (monthly ?? []).reverse().map((m: any) => ({ month: new Date(m.month).toLocaleDateString("en-IN", { month: "short" }), revenue: Number(m.revenue ?? 0) })),
        recentBookings: recent ?? [],
      });
    })();
  }, []);

  return (
    <div>
      <AdminSectionHeader title="Dashboard Overview" description="A snapshot of how Viom's Paradise is performing." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <AdminStatCard label="Total Revenue" value={formatINR(stats?.totalRevenue ?? 0)} icon={<IndianRupee className="h-5 w-5" />} />
        <AdminStatCard label="Total Bookings" value={stats?.totalBookings ?? 0} icon={<ListChecks className="h-5 w-5" />} />
        <AdminStatCard label="Today's Bookings" value={stats?.todaysBookings ?? 0} icon={<CalendarClock className="h-5 w-5" />} />
        <AdminStatCard label="Confirmed Bookings" value={stats?.confirmedBookings ?? 0} icon={<CalendarCheck className="h-5 w-5" />} />
        <AdminStatCard label="Upcoming Check-ins" value={stats?.upcomingCheckins ?? 0} icon={<LogIn className="h-5 w-5" />} />
        <AdminStatCard label="Upcoming Check-outs" value={stats?.upcomingCheckouts ?? 0} icon={<LogOut className="h-5 w-5" />} />
        <AdminStatCard label="Pending Bookings" value={stats?.pendingBookings ?? 0} icon={<Clock className="h-5 w-5" />} accent="bg-amber-100 text-amber-700" />
        <AdminStatCard label="Cancelled Bookings" value={stats?.cancelledBookings ?? 0} icon={<XCircle className="h-5 w-5" />} accent="bg-ember/10 text-ember" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr,1fr]">
        <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg text-forest-900">Revenue — Last 6 Months</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.monthly ?? []}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B08D57" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#B08D57" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F332910" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v: number) => formatINR(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#B08D57" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-forest-900">Recent Bookings</h2>
            <Link to="/admin/bookings" className="text-xs text-forest-900/50 underline">View all</Link>
          </div>
          <div className="mt-4 space-y-4">
            {stats?.recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between border-b border-forest-900/5 pb-3 text-sm last:border-0">
                <div>
                  <p className="font-medium text-forest-900">{b.guest_name}</p>
                  <p className="text-xs text-forest-900/45">{b.rooms?.name} · {formatDate(b.check_in)}</p>
                </div>
                <p className="font-semibold text-forest-900">{formatINR(b.total_amount)}</p>
              </div>
            ))}
            {stats?.recentBookings.length === 0 && <p className="text-sm text-forest-900/40">No bookings yet.</p>}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <AdminStatCard label="Homestay Active" value={stats?.activeRooms ?? 0} icon={<BedDouble className="h-5 w-5" />} />
        <AdminStatCard label="Reviews Awaiting Approval" value={stats?.pendingReviews ?? 0} icon={<Star className="h-5 w-5" />} accent="bg-ember/10 text-ember" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { to: "/admin/homestay", label: "Edit homestay details" },
          { to: "/admin/gallery", label: "Upload gallery photos" },
          { to: "/admin/reviews", label: "Moderate reviews" },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="flex items-center justify-between rounded-xl border border-forest-900/10 bg-white p-5 shadow-soft transition-colors hover:border-gold">
            <span className="text-sm font-medium text-forest-900">{a.label}</span>
            <ArrowUpRight className="h-4 w-4 text-gold" />
          </Link>
        ))}
      </div>
    </div>
  );
}
