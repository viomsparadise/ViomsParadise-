import { useEffect, useState } from "react";
import { AdminSectionHeader, AdminStatCard } from "@/components/admin/AdminUI";
import { Users, Repeat } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate, formatINR } from "@/lib/utils";

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  bookingCount: number;
  totalSpend: number;
  lastBooking: string | null;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: profiles }, { data: bookings }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, created_at"),
        supabase.from("bookings").select("user_id, total_amount, status, created_at"),
      ]);

      const rows: CustomerRow[] = (profiles ?? []).map((p) => {
        const theirBookings = (bookings ?? []).filter((b) => b.user_id === p.id && ["confirmed", "completed"].includes(b.status));
        return {
          id: p.id,
          full_name: p.full_name || "Guest",
          phone: p.phone,
          created_at: p.created_at,
          bookingCount: theirBookings.length,
          totalSpend: theirBookings.reduce((s, b) => s + Number(b.total_amount), 0),
          lastBooking: theirBookings.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0]?.created_at ?? null,
        };
      });
      setCustomers(rows.sort((a, b) => b.totalSpend - a.totalSpend));
      setLoading(false);
    })();
  }, []);

  const repeatGuests = customers.filter((c) => c.bookingCount > 1).length;

  return (
    <div>
      <AdminSectionHeader title="Customer Management" description="Everyone who has created an account with Viom's Paradise." />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <AdminStatCard label="Registered Guests" value={customers.length} icon={<Users className="h-5 w-5" />} />
        <AdminStatCard label="Repeat Guests" value={repeatGuests} icon={<Repeat className="h-5 w-5" />} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-forest-900/10 bg-white shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-forest-900/10 text-xs uppercase tracking-wide text-forest-900/40">
            <tr>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Phone</th>
              <th className="px-5 py-4">Bookings</th>
              <th className="px-5 py-4">Total Spend</th>
              <th className="px-5 py-4">Last Booking</th>
              <th className="px-5 py-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-forest-900/40">Loading customers…</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-forest-900/40">No customers yet.</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-b border-forest-900/5 last:border-0">
                  <td className="px-5 py-4 font-medium text-forest-900">{c.full_name}</td>
                  <td className="px-5 py-4 text-forest-900/60">{c.phone ?? "—"}</td>
                  <td className="px-5 py-4">{c.bookingCount}</td>
                  <td className="px-5 py-4 font-semibold text-forest-900">{formatINR(c.totalSpend)}</td>
                  <td className="px-5 py-4 text-forest-900/60">{c.lastBooking ? formatDate(c.lastBooking) : "—"}</td>
                  <td className="px-5 py-4 text-forest-900/40">{formatDate(c.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
