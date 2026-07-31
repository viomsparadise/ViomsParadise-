import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, X, User, Phone, Mail, CalendarDays } from "lucide-react";
import { AdminSectionHeader } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

type DayStatus = "available" | "fully_booked" | "maintenance" | "blocked";

interface AvailabilityRow {
  id: string;
  date: string; // yyyy-mm-dd
  status: "fully_booked" | "maintenance" | "blocked";
  reason: string | null;
  booking_id: string | null;
  bookings?: {
    booking_reference: string;
    guest_name: string;
    guest_phone: string;
    guest_email: string;
    check_in: string;
    check_out: string;
  } | null;
}

const STATUS_META: Record<DayStatus, { label: string; dot: string; cell: string }> = {
  available: { label: "Available", dot: "bg-forest-500", cell: "bg-white hover:bg-forest-50" },
  fully_booked: { label: "Fully Booked", dot: "bg-ember", cell: "bg-ember/10 hover:bg-ember/15" },
  maintenance: { label: "Maintenance", dot: "bg-amber-500", cell: "bg-amber-50 hover:bg-amber-100" },
  blocked: { label: "Blocked", dot: "bg-forest-900/50", cell: "bg-forest-900/5 hover:bg-forest-900/10" },
};

function toISO(d: Date) {
  return d.toISOString().split("T")[0];
}

// Viom's Paradise is a single homestay unit, so this calendar always shows
// availability for the one property — no room selector needed. Days marked
// "Fully Booked" here are populated automatically by a database trigger the
// moment a booking is confirmed (and released again if it's cancelled or
// rejected) — the admin only ever manually sets "Maintenance" or "Blocked".
export default function AdminAvailability() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [rows, setRows] = useState<AvailabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewingBooking, setViewingBooking] = useState<AvailabilityRow | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data: room } = await supabase.from("rooms").select("id").eq("is_active", true).limit(1).maybeSingle();
    if (!room) {
      setLoading(false);
      return;
    }
    setRoomId(room.id);

    const start = toISO(new Date(month.getFullYear(), month.getMonth(), 1));
    const end = toISO(new Date(month.getFullYear(), month.getMonth() + 1, 0));
    const { data, error } = await supabase
      .from("room_availability")
      .select("id, date, status, reason, booking_id, bookings(booking_reference, guest_name, guest_phone, guest_email, check_in, check_out)")
      .eq("room_id", room.id)
      .gte("date", start)
      .lte("date", end);

    if (error) {
      toast.error(error.message || "Could not load availability");
    }
    setRows((data as unknown as AvailabilityRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const statusByDate = useMemo(() => {
    const map = new Map<string, AvailabilityRow>();
    rows.forEach((r) => map.set(r.date, r));
    return map;
  }, [rows]);

  const weeks = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = first.getDay(); // 0 = Sunday
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [...Array(startOffset).fill(null)];
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    const out: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [month]);

  const todayISO = toISO(new Date());

  function openDay(dateISO: string) {
    const existing = statusByDate.get(dateISO);
    if (existing?.status === "fully_booked") {
      setViewingBooking(existing);
      return;
    }
    setSelectedDate(dateISO);
    setReason(existing?.reason ?? "");
  }

  async function setStatus(status: "available" | "maintenance" | "blocked") {
    if (!selectedDate || !roomId) return;
    setSaving(true);
    let error = null;
    if (status === "available") {
      const existing = statusByDate.get(selectedDate);
      if (existing) {
        const res = await supabase.from("room_availability").delete().eq("id", existing.id);
        error = res.error;
      }
    } else {
      const res = await supabase
        .from("room_availability")
        .upsert(
          { room_id: roomId, date: selectedDate, status, reason: reason || null, units_blocked: 1 },
          { onConflict: "room_id,date" }
        );
      error = res.error;
    }
    setSaving(false);
    setSelectedDate(null);
    if (error) {
      toast.error(error.message || "Could not update availability");
      return;
    }
    toast.success("Availability updated");
    load();
  }

  return (
    <div>
      <AdminSectionHeader
        title="Availability Calendar"
        description="Manually mark maintenance or blocked dates. Booked dates are set automatically when a guest's payment is confirmed."
      />

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-forest-900/10 bg-white p-5 shadow-soft">
        {(Object.keys(STATUS_META) as DayStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-2 text-xs text-forest-900/60">
            <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_META[s].dot)} /> {STATUS_META[s].label}
          </span>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-forest-900/10 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-full p-2 hover:bg-forest-900/5">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="font-display text-lg text-forest-900">
            {month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </h2>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-full p-2 hover:bg-forest-900/5">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-forest-900/40"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="mt-5">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-forest-900/40">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weeks.flat().map((day, i) => {
                if (!day) return <div key={i} className="aspect-square" />;
                const iso = toISO(day);
                const status: DayStatus = statusByDate.get(iso)?.status ?? "available";
                const meta = STATUS_META[status];
                return (
                  <button
                    key={i}
                    onClick={() => openDay(iso)}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border text-sm transition-colors",
                      meta.cell,
                      iso === todayISO ? "border-gold" : "border-forest-900/5"
                    )}
                  >
                    <span className="text-forest-900/80">{day.getDate()}</span>
                    <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/50 p-4" onClick={() => setSelectedDate(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-luxury" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-forest-900">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </h3>
              <button onClick={() => setSelectedDate(null)}><X className="h-4 w-4 text-forest-900/40" /></button>
            </div>
            <div className="mt-4">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Owner reserved, plumbing repair" className="mt-2" />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-2">
              <Button variant="outline" disabled={saving} onClick={() => setStatus("available")}>Mark Available</Button>
              <Button variant="outline" disabled={saving} onClick={() => setStatus("maintenance")} className="border-amber-300 text-amber-700 hover:bg-amber-50">Mark Maintenance</Button>
              <Button variant="outline" disabled={saving} onClick={() => setStatus("blocked")} className="border-forest-900/30">Mark Blocked</Button>
            </div>
          </div>
        </div>
      )}
      {viewingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/50 p-4" onClick={() => setViewingBooking(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-luxury" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-forest-900">Booked by</h3>
              <button onClick={() => setViewingBooking(null)}><X className="h-4 w-4 text-forest-900/40" /></button>
            </div>
            {viewingBooking.bookings ? (
              <div className="mt-4 space-y-3 text-sm text-forest-900/80">
                <p className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-gold" /> {viewingBooking.bookings.guest_name}</p>
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gold" /> {viewingBooking.bookings.guest_phone}</p>
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gold" /> {viewingBooking.bookings.guest_email}</p>
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 text-gold" />
                  {formatDate(viewingBooking.bookings.check_in)} → {formatDate(viewingBooking.bookings.check_out)}
                </p>
                <p className="text-xs text-forest-900/40">Ref: {viewingBooking.bookings.booking_reference}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-forest-900/50">No booking details found for this date.</p>
            )}
            <Link
              to="/admin/bookings"
              onClick={() => setViewingBooking(null)}
              className="mt-5 block rounded-full bg-forest-800 px-4 py-2.5 text-center text-sm font-semibold text-ivory hover:bg-forest-700"
            >
              Manage in Booking Management
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
