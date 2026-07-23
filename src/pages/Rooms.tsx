import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Viom's Paradise is booked as a single homestay unit, not a list of rooms —
// so this route just forwards straight to the homestay's detail page. Kept
// as its own route (rather than deleted) so any old "/rooms" or
// "/rooms/:slug" links (bookmarks, search engines) keep working.
export default function Rooms() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/homestay", { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center pt-24 text-forest-900/40">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}
