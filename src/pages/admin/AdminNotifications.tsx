import { Link } from "react-router-dom";
import { CheckCheck, Trash2, Circle, CalendarDays, Users, Phone, Mail, IndianRupee } from "lucide-react";
import { AdminSectionHeader } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminNotificationsContext } from "@/context/AdminNotificationsContext";
import { formatDate, formatINR } from "@/lib/utils";

export default function AdminNotifications() {
  const { notifications, unreadCount, loading, markRead, markAllRead, remove } = useAdminNotificationsContext();

  return (
    <div>
      <AdminSectionHeader
        title="Notifications"
        description="A new notification appears here the instant a booking is confirmed — no refresh needed."
        action={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4" /> Mark all as read
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <p className="text-sm text-forest-900/50">Loading notifications…</p>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-forest-900/20 bg-white p-12 text-center">
          <p className="text-forest-900/60">No notifications yet — you'll see one here as soon as a booking is confirmed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-5 shadow-soft transition-colors sm:p-6 ${
                n.is_read ? "border-forest-900/10 bg-white" : "border-gold/40 bg-gold/5"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {!n.is_read && <Circle className="mt-1.5 h-2 w-2 shrink-0 fill-gold text-gold" />}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg text-forest-900">{n.guest_name}</p>
                      <Badge variant="gold">New Booking Confirmed</Badge>
                    </div>
                    <p className="mt-1 text-xs text-forest-900/40">
                      Ref: <span className="font-semibold text-forest-900/60">{n.booking_reference}</span> · {formatDate(n.created_at, { hour: "2-digit", minute: "2-digit" })}
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 text-sm text-forest-900/70 sm:grid-cols-2">
                      <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gold" /> {n.guest_phone}</span>
                      <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gold" /> {n.guest_email}</span>
                      <span className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-gold" /> {formatDate(n.check_in)} → {formatDate(n.check_out)}
                      </span>
                      <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-gold" /> {n.num_guests} guests</span>
                      <span className="flex items-center gap-2"><IndianRupee className="h-3.5 w-3.5 text-gold" /> {formatINR(n.total_amount)}</span>
                    </div>

                    {n.booking_id && (
                      <Link to="/admin/bookings" className="mt-3 inline-block text-xs font-semibold text-forest-800 underline">
                        View in Booking Management
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => markRead(n.id, !n.is_read)}>
                    {n.is_read ? "Mark Unread" : "Mark Read"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => remove(n.id)} className="text-ember hover:bg-ember/5">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
