import { Phone } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function FloatingContact() {
  const { settings } = useSiteSettings();
  const waLink = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(
    "Hi Viom's Paradise, I'd like to know more about booking a stay."
  )}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      <a
        href={`tel:${settings.phone_number}`}
        aria-label="Call Viom's Paradise"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-800 text-ivory shadow-luxury transition-transform hover:scale-105"
      >
        <Phone className="h-5 w-5" />
      </a>
      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-luxury transition-transform hover:scale-105"
      >
        <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current">
          <path d="M16.02 3C9.4 3 4.02 8.38 4.02 15c0 2.34.68 4.52 1.86 6.37L4 29l7.83-1.83A11.9 11.9 0 0 0 16.02 27C22.64 27 28 21.62 28 15S22.64 3 16.02 3Zm0 21.6c-1.94 0-3.75-.55-5.29-1.5l-.38-.23-4.65 1.09 1.12-4.53-.25-.4A9.55 9.55 0 0 1 5.02 15c0-6.07 4.94-11 11-11s11 4.93 11 11-4.94 11.6-11 11.6Zm6.02-8.24c-.33-.16-1.95-.96-2.25-1.07-.3-.11-.52-.16-.74.16-.22.33-.85 1.07-1.04 1.29-.19.22-.38.24-.71.08-.33-.16-1.4-.51-2.66-1.63-.98-.87-1.65-1.95-1.84-2.28-.19-.33-.02-.5.14-.66.15-.15.33-.38.5-.58.16-.19.22-.33.33-.55.11-.22.05-.41-.03-.58-.08-.16-.74-1.78-1.01-2.44-.27-.64-.54-.55-.74-.56-.19-.01-.41-.01-.63-.01-.22 0-.58.08-.88.41-.3.33-1.15 1.12-1.15 2.73s1.18 3.17 1.34 3.39c.16.22 2.32 3.54 5.62 4.96.79.34 1.4.54 1.88.7.79.25 1.51.21 2.08.13.63-.1 1.95-.8 2.23-1.57.27-.77.27-1.43.19-1.57-.08-.14-.3-.22-.63-.38Z" />
        </svg>
      </a>
    </div>
  );
}
