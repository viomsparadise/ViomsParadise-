import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

function toISO(d: Date) {
  return d.toISOString().split("T")[0];
}
function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

interface Props {
  roomId?: string;
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
}

/**
 * A self-contained month calendar. Dates already covered by a confirmed
 * booking or an admin block come back red and are unselectable; everything
 * else is green. Clicking selects check-in first, then check-out — if the
 * range you're trying to select would pass through a red date, that click
 * is rejected and treated as a fresh check-in instead.
 */
export function AvailabilityCalendar({ roomId, checkIn, checkOut, onChange }: Props) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const d = checkIn ? new Date(checkIn) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [unavailable, setUnavailable] = useState<Map<string, { kind: string; guest_name: string | null }>>(new Map());
  const [loading, setLoading] = useState(true);

  // Fetch a 3-month window (previous, current, next) around the visible
  // month so navigating doesn't flash empty/loading on every click.
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const rangeStart = toISO(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1));
      const rangeEnd = toISO(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 2, 0));

      let query = supabase.from("unavailable_dates").select("date, kind, guest_name").gte("date", rangeStart).lte("date", rangeEnd);
      if (roomId) query = query.eq("room_id", roomId);
      const { data, error } = await query;

      if (!active) return;
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Could not load availability:", error.message);
      }
      const map = new Map<string, { kind: string; guest_name: string | null }>();
      (data ?? []).forEach((row: any) => map.set(row.date, { kind: row.kind, guest_name: row.guest_name }));
      setUnavailable(map);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [visibleMonth, roomId]);

  const today = startOfDay(new Date());

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leadingBlanks = firstDay.getDay();
    const cells: (Date | null)[] = Array.from({ length: leadingBlanks }, () => null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
    return cells;
  }, [visibleMonth]);

  function isInSelectedRange(iso: string) {
    if (!checkIn || !checkOut) return false;
    return iso >= checkIn && iso < checkOut;
  }

  function rangeHasUnavailableDate(startIso: string, endIso: string) {
    const cursor = new Date(startIso);
    const end = new Date(endIso);
    while (cursor < end) {
      if (unavailable.has(toISO(cursor))) return true;
      cursor.setDate(cursor.getDate() + 1);
    }
    return false;
  }

  function handleClick(date: Date) {
    const iso = toISO(date);
    if (unavailable.has(iso) || startOfDay(date) < today) return;

    const noSelectionYet = !checkIn || (checkIn && checkOut);
    if (noSelectionYet) {
      onChange(iso, "");
      return;
    }
    // Picking the check-out date
    if (iso <= checkIn) {
      onChange(iso, "");
      return;
    }
    if (rangeHasUnavailableDate(checkIn, iso)) {
      // Can't span over a booked/blocked date — restart selection here instead.
      onChange(iso, "");
      return;
    }
    onChange(checkIn, iso);
  }

  return (
    <div className="rounded-2xl border border-forest-900/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-forest-900/60 hover:bg-forest-900/5"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-display text-base text-forest-900">
          {visibleMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={() => setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-forest-900/60 hover:bg-forest-900/5"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-forest-900/40">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className={cn("mt-1 grid grid-cols-7 gap-1", loading && "opacity-50")}>
        {days.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} />;
          const iso = toISO(date);
          const isPast = startOfDay(date) < today;
          const blocked = unavailable.has(iso);
          const isCheckIn = iso === checkIn;
          const isCheckOut = iso === checkOut;
          const inRange = isInSelectedRange(iso);
          const disabled = isPast || blocked;

          return (
            <button
              type="button"
              key={iso}
              disabled={disabled}
              onClick={() => handleClick(date)}
              title={blocked ? unavailable.get(iso)?.guest_name ? `Booked` : "Unavailable" : undefined}
              className={cn(
                "flex h-9 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                isPast && "text-forest-900/20 cursor-not-allowed",
                blocked && !isPast && "cursor-not-allowed bg-red-50 text-red-400 line-through",
                !disabled && !inRange && "bg-forest-50 text-forest-800 hover:bg-gold/20",
                !disabled && !isPast && !blocked && "bg-emerald-50",
                (isCheckIn || isCheckOut) && "bg-forest-800 text-ivory hover:bg-forest-800",
                inRange && !isCheckIn && !isCheckOut && "bg-gold/25 text-forest-900"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-forest-900/50">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-200" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-200" /> Booked / Blocked</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-forest-800" /> Selected</span>
      </div>
    </div>
  );
}
