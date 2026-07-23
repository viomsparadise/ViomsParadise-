import { useEffect, useMemo, useState } from "react";
import { AdminSectionHeader, AdminStatCard } from "@/components/admin/AdminUI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IndianRupee, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate, formatINR } from "@/lib/utils";
import { toast } from "sonner";

interface PaymentRow {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  method: string | null;
  status: string;
  refund_amount: number;
  created_at: string;
  bookings: { booking_reference: string; guest_name: string } | null;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "outline"> = {
  captured: "success",
  created: "warning",
  authorized: "warning",
  failed: "danger",
  refunded: "outline",
};

export default function AdminPayments() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("payments")
      .select("*, bookings(booking_reference, guest_name)")
      .order("created_at", { ascending: false });
    setPayments((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const captured = payments.filter((p) => p.status === "captured");
    return {
      totalCaptured: captured.reduce((s, p) => s + Number(p.amount), 0),
      successCount: captured.length,
      failedCount: payments.filter((p) => p.status === "failed").length,
      refundedCount: payments.filter((p) => p.status === "refunded").length,
    };
  }, [payments]);

  async function markRefunded(id: string, amount: number) {
    if (!window.confirm("Mark this payment as refunded? This does not itself trigger a Razorpay refund — process the refund in your Razorpay dashboard first, then record it here.")) return;
    const { error } = await supabase.from("payments").update({ status: "refunded", refund_amount: amount }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Payment marked as refunded");
    load();
  }

  return (
    <div>
      <AdminSectionHeader title="Payment Management" description="Every Razorpay transaction, synced automatically at checkout." />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Captured Revenue" value={formatINR(stats.totalCaptured)} icon={<IndianRupee className="h-5 w-5" />} />
        <AdminStatCard label="Successful Payments" value={stats.successCount} icon={<CheckCircle2 className="h-5 w-5" />} />
        <AdminStatCard label="Failed Payments" value={stats.failedCount} icon={<XCircle className="h-5 w-5" />} accent="bg-ember/10 text-ember" />
        <AdminStatCard label="Refunds Issued" value={stats.refundedCount} icon={<RotateCcw className="h-5 w-5" />} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-forest-900/10 bg-white shadow-soft">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-forest-900/10 text-xs uppercase tracking-wide text-forest-900/40">
            <tr>
              <th className="px-5 py-4">Booking</th>
              <th className="px-5 py-4">Order ID</th>
              <th className="px-5 py-4">Amount</th>
              <th className="px-5 py-4">Method</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-forest-900/40">Loading transactions…</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-forest-900/40">No transactions yet.</td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b border-forest-900/5 last:border-0">
                  <td className="px-5 py-4">
                    <p className="font-medium text-forest-900">{p.bookings?.booking_reference}</p>
                    <p className="text-xs text-forest-900/40">{p.bookings?.guest_name}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-forest-900/50">{p.razorpay_order_id}</td>
                  <td className="px-5 py-4 font-semibold text-forest-900">{formatINR(p.amount)}</td>
                  <td className="px-5 py-4 text-forest-900/60">{p.method ?? "—"}</td>
                  <td className="px-5 py-4"><Badge variant={STATUS_VARIANT[p.status] ?? "outline"}>{p.status}</Badge></td>
                  <td className="px-5 py-4 text-forest-900/50">{formatDate(p.created_at)}</td>
                  <td className="px-5 py-4">
                    {p.status === "captured" && (
                      <Button size="sm" variant="outline" onClick={() => markRefunded(p.id, p.amount)}>Mark Refunded</Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
