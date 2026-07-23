import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Maximize, BedDouble, Star, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NearbyRestaurants } from "@/components/shared/NearbyRestaurants";
import { Lightbox } from "@/components/gallery/Lightbox";
import { useRooms } from "@/hooks/useRooms";
import { useApprovedReviews } from "@/hooks/useContent";
import { formatINR } from "@/lib/utils";

// Viom's Paradise is a single homestay unit, so this page always shows "the"
// homestay (whatever slug is in the URL, or just the one active listing) —
// there's no concept of picking between multiple rooms.
export default function RoomDetails() {
  const { rooms, loading } = useRooms();
  const navigate = useNavigate();
  const homestay = rooms[0];
  const { reviews } = useApprovedReviews(homestay?.id);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (loading && !homestay) {
    return <div className="flex min-h-[70vh] items-center justify-center text-forest-900/50">Loading homestay…</div>;
  }

  if (!homestay) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-display text-2xl text-forest-900">Homestay details are not available right now</p>
        <Link to="/"><Button variant="outline">Back to Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="pt-24">
      <div className="container-luxe pt-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-forest-900/60 hover:text-forest-900">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Gallery grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 overflow-hidden rounded-2xl sm:grid-cols-4 sm:grid-rows-2">
          {homestay.images.slice(0, 5).map((img, i) => (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              className={`overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1"}`}
            >
              <img src={img} alt={`${homestay.name} ${i + 1}`} loading="lazy" className="h-full w-full min-h-[140px] object-cover transition-transform duration-500 hover:scale-105" />
            </button>
          ))}
        </div>
        <Lightbox images={homestay.images} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
      </div>

      <div className="container-luxe grid grid-cols-1 gap-14 py-16 lg:grid-cols-[1.4fr,1fr]">
        <div>
          <p className="eyebrow">The Whole Homestay, Just For You</p>
          <h1 className="mt-2 font-display text-4xl text-forest-900 sm:text-5xl">{homestay.name}</h1>

          <div className="mt-5 flex flex-wrap gap-6 text-sm text-forest-900/60">
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-gold" /> Up to {homestay.max_guests} guests</span>
            <span className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-gold" /> {homestay.bed_config}</span>
            {homestay.size_sqft > 0 && <span className="flex items-center gap-2"><Maximize className="h-4 w-4 text-gold" /> {homestay.size_sqft} sq ft</span>}
            {homestay.avg_rating > 0 && (
              <span className="flex items-center gap-2"><Star className="h-4 w-4 fill-gold text-gold" /> {homestay.avg_rating} ({homestay.review_count} reviews)</span>
            )}
          </div>

          <p className="mt-8 max-w-2xl text-base leading-relaxed text-forest-900/70">{homestay.description}</p>

          <div className="mt-10">
            <h3 className="font-display text-xl text-forest-900">Amenities</h3>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {homestay.amenities.map((a) => (
                <span key={a} className="flex items-center gap-2 text-sm text-forest-900/70">
                  <Check className="h-4 w-4 text-forest-500" /> {a}
                </span>
              ))}
            </div>
          </div>

          <NearbyRestaurants className="mt-10 max-w-lg" />

          {reviews.length > 0 && (
            <div className="mt-14">
              <h3 className="font-display text-xl text-forest-900">Guest Reviews</h3>
              <div className="mt-5 space-y-5">
                {reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="rounded-xl bg-sand-100 p-6">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-gold text-gold" : "text-forest-900/15"}`} />
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-forest-900/70">"{r.comment}"</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-forest-900/40">{r.guest_name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky booking card */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-forest-900/10 bg-white p-8 shadow-luxury">
            <p className="font-display text-3xl text-forest-900">
              {formatINR(homestay.price_per_night)} <span className="text-sm font-body font-normal text-forest-900/50">/ night</span>
            </p>
            <p className="mt-1 text-xs text-forest-900/45">For the entire homestay · taxes calculated at checkout</p>
            <Link to="/booking">
              <Button variant="gold" size="lg" className="mt-6 w-full">Book Your Stay</Button>
            </Link>
            <p className="mt-4 text-center text-xs text-forest-900/40">Instant confirmation after secure payment</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
