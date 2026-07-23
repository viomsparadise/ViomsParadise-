import { Utensils, ArrowUpRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

function restaurantSearchUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`restaurants near ${address}`)}`;
}

/**
 * variant="card"    — full card with description, used on content pages (Rooms, About, Room Details)
 * variant="compact" — a single inline link, used in tighter spots (Footer, Booking Confirmation)
 */
export function NearbyRestaurants({ className, variant = "card" }: { className?: string; variant?: "card" | "compact" }) {
  const { settings } = useSiteSettings();
  const url = restaurantSearchUrl(settings.address);

  if (variant === "compact") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={cn("inline-flex items-center gap-2 text-sm underline-offset-2 hover:underline", className)}
      >
        <Utensils className="h-3.5 w-3.5" /> Search nearby restaurants
      </a>
    );
  }

  return (
    <div className={cn("flex items-center gap-4 rounded-xl border border-gold/25 bg-gold/10 px-5 py-4", className)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
        <Utensils className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">
  Meals & dining
</p>

<p className="text-sm text-white/70">
  Viom's Paradise is a self-catered stay. Find restaurants and eateries near the property in a couple of taps.
</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-forest-800 px-4 py-2 text-xs font-semibold text-ivory hover:bg-forest-700"
      >
        Search Nearby <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
