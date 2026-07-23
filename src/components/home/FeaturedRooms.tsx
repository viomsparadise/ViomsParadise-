import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Users, BedDouble, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRooms } from "@/hooks/useRooms";
import { formatINR } from "@/lib/utils";

// Viom's Paradise is a single homestay unit — there's nothing to browse
// between, so the home page shows one large showcase of the property
// itself (photo, description, amenities, price) rather than a grid of
// multiple "room" cards.
export function FeaturedRooms() {
  const { rooms } = useRooms();
  const homestay = rooms[0];

  if (!homestay) return null;

  return (
    <section className="bg-ivory py-24 sm:py-32">
      <div className="container-luxe grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="space-y-3"
        >
          <div className="overflow-hidden rounded-2xl">
            <img
              src={homestay.images[0]}
              alt={homestay.name}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
          {homestay.images.length > 1 && (
            <div className="grid grid-cols-2 gap-3">
              {homestay.images.slice(1, 3).map((img, i) => (
                <div key={i} className="overflow-hidden rounded-xl">
                  <img src={img} alt={`${homestay.name} ${i + 2}`} loading="lazy" className="aspect-square w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <div>
          <p className="eyebrow">The Whole Homestay, Just For You</p>
          <h2 className="mt-3 text-balance font-display text-4xl text-forest-900 sm:text-5xl">
            {homestay.name}
          </h2>
          <p className="mt-6 max-w-lg leading-relaxed text-forest-900/65">{homestay.short_description}</p>

          <div className="mt-8 flex flex-wrap gap-6 text-sm text-forest-900/60">
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-gold" /> Up to {homestay.max_guests} guests</span>
            <span className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-gold" /> {homestay.bed_config}</span>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-y-3 sm:grid-cols-2">
            {homestay.amenities.slice(0, 6).map((a) => (
              <span key={a} className="flex items-center gap-2 text-sm text-forest-900/70">
                <Check className="h-4 w-4 text-forest-500" /> {a}
              </span>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <p className="font-display text-2xl text-forest-900">
              {formatINR(homestay.price_per_night)} <span className="text-sm font-body font-normal text-forest-900/50">/ night, entire homestay</span>
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/homestay">
              <Button variant="outline">
                See Full Details <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/booking">
              <Button variant="gold">Book Your Stay</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
