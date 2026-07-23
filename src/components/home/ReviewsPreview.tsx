import { Link } from "react-router-dom";
import { Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApprovedReviews } from "@/hooks/useContent";

export function ReviewsPreview() {
  const { reviews } = useApprovedReviews();

  return (
    <section className="bg-sand-100 py-24 sm:py-32">
      <div className="container-luxe">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Guest Words</p>
            <h2 className="mt-3 max-w-xl text-balance font-display text-4xl text-forest-900 sm:text-5xl">
              What staying here feels like.
            </h2>
          </div>
          <Link to="/reviews" className="shrink-0">
            <Button variant="outline">Read All Reviews <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {reviews.slice(0, 3).map((r) => (
            <div key={r.id} className="flex flex-col rounded-2xl bg-white p-8 shadow-soft">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-gold text-gold" : "text-forest-900/15"}`} />
                ))}
              </div>
              <p className="mt-4 font-display text-lg text-forest-900">{r.title}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-forest-900/60">"{r.comment}"</p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-forest-900/40">
                {r.guest_name} · {r.room_name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
