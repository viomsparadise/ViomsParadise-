import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarCheck, UserCircle, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/bookings", label: "My Bookings", icon: CalendarCheck },
  { to: "/dashboard/profile", label: "Profile", icon: UserCircle },
];

export default function DashboardLayout() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-sand-100 pt-24">
      <div className="container-luxe grid grid-cols-1 gap-8 py-10 lg:grid-cols-[260px,1fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
            <p className="font-display text-lg text-forest-900">{profile?.full_name || "Guest"}</p>
            <p className="text-xs text-forest-900/50">{user?.phone || profile?.phone}</p>
            <nav className="mt-6 flex flex-col gap-1">
              {LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive ? "bg-forest-800 text-ivory" : "text-forest-800/70 hover:bg-forest-900/5"
                    )
                  }
                >
                  <l.icon className="h-4 w-4" /> {l.label}
                </NavLink>
              ))}
              <button onClick={handleSignOut} className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ember hover:bg-ember/5">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </nav>
          </div>
        </aside>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
