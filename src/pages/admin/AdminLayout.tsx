import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, BedDouble, CalendarCheck, CreditCard, Image, Star,
  CalendarClock, Settings, Users, TrendingUp, BarChart3, ScrollText, LogOut, ExternalLink, MapPin, Bell,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdminNotificationsProvider, useAdminNotificationsContext } from "@/context/AdminNotificationsContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/homestay", label: "Homestay Details", icon: BedDouble },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/availability", label: "Availability", icon: CalendarClock },
  { to: "/admin/attractions", label: "Attractions", icon: MapPin },
  { to: "/admin/gallery", label: "Gallery", icon: Image },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: TrendingUp },
  { to: "/admin/bookings-analytics", label: "Booking Trends", icon: BarChart3 },
  { to: "/admin/settings", label: "Website Settings", icon: Settings },
  { to: "/admin/logs", label: "System Logs", icon: ScrollText },
];

function AdminLayoutInner() {
  const { profile, signOut } = useAuth();
  const { unreadCount } = useAdminNotificationsContext();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-forest-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ivory/10 bg-forest-950 p-5 lg:flex">
        <div className="px-2 py-3">
          <p className="font-display text-lg text-ivory">Viom's <span className="italic text-gold">Paradise</span></p>
          <p className="text-xs text-ivory/40">Admin Control Panel</p>
        </div>
        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
          {NAV.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-gold text-forest-950" : "text-ivory/60 hover:bg-ivory/5 hover:text-ivory"
                )
              }
            >
              <span className="flex items-center gap-3">
                <l.icon className="h-4 w-4" /> {l.label}
              </span>
              {l.to === "/admin/notifications" && unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1.5 text-[11px] font-semibold text-ivory">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-ivory/10 pt-4">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ivory/60 hover:bg-ivory/5">
            <ExternalLink className="h-4 w-4" /> View Website
          </a>
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ember-light hover:bg-ivory/5">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-ivory/10 bg-forest-950 px-6 py-4 lg:hidden">
          <p className="font-display text-ivory">Admin</p>
          <Link to="/admin/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-full text-ivory/70 hover:bg-ivory/5">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ember text-[9px] font-semibold text-ivory">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </header>
        <main className="min-h-screen bg-sand-50 p-5 sm:p-8">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <select
              onChange={(e) => navigate(e.target.value)}
              className="w-full rounded-lg border border-forest-900/15 bg-white px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>Jump to section…</option>
              {NAV.map((l) => <option key={l.to} value={l.to}>{l.label}</option>)}
            </select>
          </div>
          <div className="mb-6 text-right text-xs text-forest-900/40">Signed in as {profile?.full_name || "Admin"}</div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminNotificationsProvider>
      <AdminLayoutInner />
    </AdminNotificationsProvider>
  );
}
