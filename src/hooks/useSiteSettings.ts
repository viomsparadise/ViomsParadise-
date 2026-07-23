import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface SiteSettings {
  business_name: string;
  tagline: string;
  phone_number: string;
  whatsapp_number: string;
  address: string;
  contact_email: string;
  google_maps_link: string;
  food_service_available: boolean;
  logo_path: string;
  social_instagram: string;
  social_facebook: string;
  check_in_time: string;
  check_out_time: string;
  cancellation_free_hours: number;
  tax_percent: number;
}

const FALLBACK: SiteSettings = {
  business_name: "Viom's Paradise",
  tagline: "Experience Comfort, Nature, and Peace.",
  phone_number: import.meta.env.VITE_PHONE_NUMBER || "+91 99999 99999",
  whatsapp_number: import.meta.env.VITE_WHATSAPP_NUMBER || "919999999999",
  address: "Viom's Paradise, Near Sevoke Road, Siliguri, West Bengal, India",
  contact_email: "stay@viomsparadise.com",
  google_maps_link: "https://maps.google.com/?q=Siliguri,West+Bengal",
  food_service_available: false,
  logo_path: "",
  social_instagram: "",
  social_facebook: "",
  check_in_time: "1:00 PM",
  check_out_time: "11:00 AM",
  cancellation_free_hours: 72,
  tax_percent: 12,
};

let cache: SiteSettings | null = null;

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cache ?? FALLBACK);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let active = true;
    supabase
      .from("site_settings")
      .select("key, value")
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) {
          setLoading(false);
          return;
        }
        const merged = { ...FALLBACK };
        for (const row of data) {
          // values are stored as jsonb — already parsed by the client
          (merged as any)[row.key] = row.value;
        }
        cache = merged;
        setSettings(merged);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { settings, loading };
}
