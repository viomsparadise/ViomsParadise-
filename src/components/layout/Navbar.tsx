import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, User as UserIcon, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn, storageUrl } from "@/lib/utils";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Homestay", to: "/homestay" },
  { label: "Gallery", to: "/gallery" },
  { label: "About", to: "/about" },
  { label: "Attractions", to: "/attractions" },
  { label: "Reviews", to: "/reviews" },
  { label: "Contact", to: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, isAdmin } = useAuth();
  const { settings } = useSiteSettings();

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const transparent = isHome && !scrolled && !open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        transparent ? "bg-transparent py-6" : "bg-ivory/95 py-3 shadow-soft backdrop-blur-md"
      )}
    >
      <div className="container-luxe flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          {settings.logo_path && (
            <img src={storageUrl(settings.logo_path)} alt="" className="h-9 w-9 object-contain" />
          )}
          <span className={cn("font-display text-xl tracking-wide transition-colors", transparent ? "text-ivory" : "text-forest-900")}>
            Viom's <span className="italic text-gold">Paradise</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium tracking-wide transition-colors",
                  transparent ? "text-ivory/85 hover:text-ivory" : "text-forest-800/80 hover:text-forest-900",
                  isActive && (transparent ? "text-ivory" : "text-gold-dark")
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAdmin && (
            <Link to="/admin">
              <Button variant={transparent ? "outlineLight" : "outline"} size="sm">
                <LayoutDashboard className="h-4 w-4" /> Admin
              </Button>
            </Link>
          )}
          <Link to={user ? "/dashboard" : "/verify-phone"}>
            <Button variant={transparent ? "outlineLight" : "outline"} size="sm">
              <UserIcon className="h-4 w-4" /> {user ? "My Account" : "Sign In"}
            </Button>
          </Link>
          <Link to="/booking">
            <Button variant="gold" size="sm">
              Book Now
            </Button>
          </Link>
        </div>

        <button
          className={cn("lg:hidden", transparent ? "text-ivory" : "text-forest-900")}
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-ivory lg:hidden"
          >
            <div className="container-luxe flex flex-col gap-1 py-4">
              {LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} className="rounded-lg px-3 py-3 text-forest-800 hover:bg-forest-900/5">
                  {l.label}
                </NavLink>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-forest-900/10 pt-4">
                {isAdmin && (
                  <Link to="/admin"><Button variant="outline" className="w-full">Admin Dashboard</Button></Link>
                )}
                <Link to={user ? "/dashboard" : "/verify-phone"}>
                  <Button variant="outline" className="w-full">{user ? "My Account" : "Sign In"}</Button>
                </Link>
                <Link to="/booking"><Button variant="gold" className="w-full">Book Now</Button></Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
