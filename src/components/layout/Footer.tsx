import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin, Phone, Mail } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { storageUrl } from "@/lib/utils";
import { NearbyRestaurants } from "@/components/shared/NearbyRestaurants";

const SITEMAP = [
  {
    heading: "Explore",
    links: [
      { label: "The Homestay", to: "/homestay" },
      { label: "Gallery", to: "/gallery" },
      { label: "About Us", to: "/about" },
      { label: "Nearby Attractions", to: "/attractions" },
      { label: "Guest Reviews", to: "/reviews" },
    ],
  },
  {
    heading: "Plan Your Stay",
    links: [
      { label: "Book Now", to: "/booking" },
      { label: "FAQ", to: "/faq" },
      { label: "Contact Us", to: "/contact" },
      { label: "My Bookings", to: "/dashboard" },
    ],
  },
  {
    heading: "Policies",
    links: [
      { label: "Cancellation Policy", to: "/cancellation-policy" },
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms & Conditions", to: "/terms-conditions" },
    ],
  },
];

export function Footer() {
  const { settings } = useSiteSettings();

  return (
    <footer className="relative overflow-hidden bg-forest-950 text-ivory">
      {/* Canopy-line signature motif */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 overflow-hidden opacity-40">
        <svg viewBox="0 0 1400 120" className="h-full w-[200%] animate-drift" preserveAspectRatio="none">
          <path
            d="M0 90 C 100 40, 200 110, 300 60 S 500 20, 600 70 S 800 100, 900 50 S 1100 10, 1200 60 S 1350 90, 1400 60 L 1400 120 L 0 120 Z"
            fill="#3F5A45"
          />
          <path
            d="M1400 90 C 1500 40, 1600 110, 1700 60 S 1900 20, 2000 70 S 2200 100, 2300 50 S 2500 10, 2600 60 S 2750 90, 2800 60 L 2800 120 L 1400 120 Z"
            fill="#3F5A45"
          />
        </svg>
      </div>

      <div className="container-luxe relative pt-20 pb-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              {settings.logo_path && (
                <img src={storageUrl(settings.logo_path)} alt="" className="h-9 w-9 object-contain" />
              )}
              <span className="font-display text-2xl">
                Viom's <span className="italic text-gold">Paradise</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivory/60">
              {settings.tagline} A luxury home stay folded into the tea gardens and misted forest hills
              near Siliguri — built for guests who want stillness, not spectacle.
            </p>
            <div className="mt-6 flex gap-3">
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 hover:border-gold hover:text-gold transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {settings.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 hover:border-gold hover:text-gold transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {SITEMAP.map((col) => (
            <div key={col.heading}>
              <h4 className="eyebrow text-gold/80">{col.heading}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-ivory/70 transition-colors hover:text-ivory">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="eyebrow text-gold/80">Reach Us</h4>
            <ul className="mt-4 space-y-3 text-sm text-ivory/70">
              <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-gold" /> {settings.address}</li>
              <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-gold" /> {settings.phone_number}</li>
              <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-gold" /> {settings.contact_email}</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-ivory/10 pt-8">
          <NearbyRestaurants variant="compact" className="text-ivory/70 hover:text-ivory" />
          <div className="mt-6 flex flex-col gap-3 text-xs text-ivory/40 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Viom's Paradise. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <p>Crafted for guests who travel slowly.</p>
              <span className="hidden text-ivory/20 sm:inline">|</span>
              <Link to="/admin/login" className="text-ivory/40 underline-offset-2 transition-colors hover:text-gold hover:underline">
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
