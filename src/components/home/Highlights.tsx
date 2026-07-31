import { motion } from "framer-motion";
import { Leaf, Mountain, Wind, ShieldCheck } from "lucide-react";
import { NearbyRestaurants } from "@/components/shared/NearbyRestaurants";

const HIGHLIGHTS = [
  { icon: Leaf, title: "Set Among Tea Gardens", copy: "Every room looks out over working tea estates and forested foothills — no two views the same." },
  { icon: Mountain, title: "Foothill Location", copy: "Close enough to the plains for an easy arrival, high enough for the air to change." },
  { icon: Wind, title: "Deliberately Quiet", copy: "One homestay, booked by one group at a time. No events, no crowds — just the property and the hillside around it." },
  { icon: ShieldCheck, title: "Secure Online Booking", copy: "Instant confirmation with encrypted payments — know your stay is locked in before you pack." },
];

export function Highlights() {
  return (
    <section className="relative overflow-hidden bg-forest-900 py-24 text-ivory sm:py-32">
      <img
        src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2000&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-15"
      />
      <div className="container-luxe relative grid grid-cols-1 gap-16 lg:grid-cols-[0.9fr,1.1fr]">
        <div>
          <p className="eyebrow">The Property</p>
          <h2 className="mt-3 text-balance font-display text-4xl leading-tight sm:text-5xl">
            A home stay built around <em className="italic text-gold">stillness</em>, not amenities.
          </h2>
          <p className="mt-6 max-w-md text-ivory/65">
            Viom's Paradise doesn't try to be a resort. There's no restaurant, no spa menu, no events
            calendar — just four considered rooms, a hillside of tea, and staff who leave you alone
            when you want to be left alone.
          </p>
          <NearbyRestaurants className="mt-8 max-w-md" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {HIGHLIGHTS.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="rounded-2xl border border-ivory/10 bg-ivory/5 p-7 backdrop-blur-sm"
            >
              <h.icon className="h-6 w-6 text-gold" />
              <h3 className="mt-5 font-display text-lg">{h.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ivory/60">{h.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
