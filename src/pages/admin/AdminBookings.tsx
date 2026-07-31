import { useEffect, useMemo, useState } from "react";
import { Search, Printer, Download, Loader2, StickyNote, X, XCircle } from "lucide-react";
import { AdminSectionHeader } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import type { BookingStatus } from "@/lib/database.types";
import { formatDate, formatINR } from "@/lib/utils";
import { toast } from "sonner";

interface BookingRow {
  id: string;
  booking_reference: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  total_amount: number;
  status: string;
  admin_notes: string | null;
  created_at: string;
  rooms: { name: string } | null;
}

const STATUS_FILTERS = ["all", "pending_payment", "confirmed", "completed", "cancelled", "rejected", "expired", "refunded"] as const;
const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "outline"> = {
  confirmed: "success",
  pending_payment: "warning",
  cancelled: "danger",
  rejected: "danger",
  completed: "outline",
  expired: "outline",
  refunded: "outline",
};
const ALL_STATUSES: BookingStatus[] = ["pending_payment", "confirmed", "completed", "cancelled", "rejected", "expired", "refunded"];

export default function AdminBookings() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notesFor, setNotesFor] = useState<BookingRow | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("id, booking_reference, guest_name, guest_email, guest_phone, check_in, check_out, num_guests, total_amount, status, admin_notes, created_at, rooms(name)")
      .order("created_at", { ascending: false });
    setBookings((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = status === "all" || b.status === status;
      const q = search.toLowerCase();
      const matchesSearch =
        !q || b.guest_name.toLowerCase().includes(q) || b.booking_reference.toLowerCase().includes(q) || b.guest_email.toLowerCase().includes(q);
      const matchesFrom = !dateFrom || b.check_in >= dateFrom;
      const matchesTo = !dateTo || b.check_in <= dateTo;
      return matchesStatus && matchesSearch && matchesFrom && matchesTo;
    });
  }, [bookings, status, search, dateFrom, dateTo]);

  async function updateStatus(id: string, newStatus: BookingStatus) {
    setUpdatingId(id);
    const { error } = await supabase.from("bookings").update({ status: newStatus }).eq("id", id);
    setUpdatingId(null);
    if (error) return toast.error(error.message);
    toast.success(`Booking marked as ${newStatus.replace("_", " ")}`);
    load();
  }

  function openNotes(b: BookingRow) {
    setNotesFor(b);
    setNotesDraft(b.admin_notes ?? "");
  }

  async function saveNotes() {
    if (!notesFor) return;
    setSavingNotes(true);
    const { error } = await supabase.from("bookings").update({ admin_notes: notesDraft || null }).eq("id", notesFor.id);
    setSavingNotes(false);
    if (error) return toast.error(error.message);
    toast.success("Note saved");
    setNotesFor(null);
    load();
  }

  function exportCsv() {
    const header = ["Reference", "Guest", "Email", "Phone", "Room", "Check-in", "Check-out", "Guests", "Total", "Status", "Notes"];
    const rows = filtered.map((b) => [
      b.booking_reference, b.guest_name, b.guest_email, b.guest_phone, b.rooms?.name ?? "",
      b.check_in, b.check_out, b.num_guests, b.total_amount, b.status, b.admin_notes ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `viomsparadise-bookings-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <AdminSectionHeader
        title="Booking Management"
        description="View, search, and manage every booking on the platform."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
            <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-900/40" />
          <Input placeholder="Search by name, email, or reference…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11" />
        </div>
        <div>
          <Label className="mb-2 block">Check-in from</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <Label className="mb-2 block">Check-in to</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="flex items-center gap-1 pb-2.5 text-xs text-forest-900/50 hover:text-forest-900">
            <XCircle className="h-3.5 w-3.5" /> Clear dates
          </button>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              status === s ? "bg-forest-800 text-ivory" : "bg-white text-forest-800/60 hover:bg-forest-900/5"
            }`}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-forest-900/10 bg-white shadow-soft">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-forest-900/10 text-xs uppercase tracking-wide text-forest-900/40">
            <tr>
              <th className="px-5 py-4">Reference</th>
              <th className="px-5 py-4">Guest</th>
              <th className="px-5 py-4">Dates</th>
              <th className="px-5 py-4">Total</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Change Status</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-forest-900/40">Loading bookings…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-forest-900/40">No bookings match your filters.</td></tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id} className="border-b border-forest-900/5 last:border-0 align-top">
                  <td className="px-5 py-4 font-medium text-forest-900">{b.booking_reference}</td>
                  <td className="px-5 py-4">
                    <p className="text-forest-900">{b.guest_name}</p>
                    <p className="text-xs text-forest-900/40">{b.guest_email}</p>
                    <p className="text-xs text-forest-900/40">{b.guest_phone}</p>
                  </td>
                  <td className="px-5 py-4 text-forest-900/70">{formatDate(b.check_in)} → {formatDate(b.check_out)}<br /><span className="text-xs text-forest-900/40">{b.num_guests} guests</span></td>
                  <td className="px-5 py-4 font-semibold text-forest-900">{formatINR(b.total_amount)}</td>
                  <td className="px-5 py-4"><Badge variant={STATUS_VARIANT[b.status] ?? "outline"}>{b.status.replace("_", " ")}</Badge></td>
                  <td className="px-5 py-4">
                    <select
                      value={b.status}
                      disabled={updatingId === b.id}
                      onChange={(e) => updateStatus(b.id, e.target.value as BookingStatus)}
                      className="h-9 rounded-lg border border-forest-900/15 bg-white px-2 text-xs"
                    >
                      {ALL_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {b.status === "pending_payment" && (
                        <>
                          <Button size="sm" variant="outline" disabled={updatingId === b.id} onClick={() => updateStatus(b.id, "confirmed")}>
                            {updatingId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                          </Button>
                          <Button size="sm" variant="outline" disabled={updatingId === b.id} onClick={() => updateStatus(b.id, "rejected")} className="text-ember">
                            Reject
                          </Button>
                        </>
                      )}
                      {b.status === "confirmed" && (
                        <>
                          <Button size="sm" variant="outline" disabled={updatingId === b.id} onClick={() => updateStatus(b.id, "completed")}>Complete</Button>
                          <Button size="sm" variant="outline" disabled={updatingId === b.id} onClick={() => updateStatus(b.id, "cancelled")} className="text-ember">Cancel</Button>
                        </>
                      )}
                      {(b.status === "confirmed" || b.status === "completed") && (
                        <Button size="sm" variant="outline" disabled={updatingId === b.id} onClick={() => updateStatus(b.id, "refunded")}>Refund Ready</Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openNotes(b)}>
                        <StickyNote className="h-3 w-3" /> {b.admin_notes ? "Note" : "Add Note"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {notesFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/50 p-4" onClick={() => setNotesFor(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-luxury" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-forest-900">Note — {notesFor.booking_reference}</h3>
              <button onClick={() => setNotesFor(null)}><X className="h-4 w-4 text-forest-900/40" /></button>
            </div>
            <p className="mt-1 text-xs text-forest-900/40">Internal only — never shown to the guest.</p>
            <Textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} className="mt-4 min-h-32" placeholder="e.g. Guest requested early check-in, called to confirm arrival time…" />
            <Button variant="gold" className="mt-4 w-full" disabled={savingNotes} onClick={saveNotes}>
              {savingNotes && <Loader2 className="h-4 w-4 animate-spin" />} Save Note
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
