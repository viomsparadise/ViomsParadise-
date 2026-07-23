import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAttractions } from "@/hooks/useContent";

export default function NearbyAttractions() {
  const { attractions } = useAttractions();

  return (
    <>
      <PageHeader
        eyebrow="Beyond the Property"
        title="Nearby Attractions"
        description="What's worth a half-day trip from the hillside."
        image="https://images.unsplash.com/photo-1570789210967-2cac24afeb00?q=80&w=2000&auto=format&fit=crop"
      />

      <section className="bg-ivory py-16 sm:py-24">
        <div className="container-luxe space-y-16">
          {attractions.map((a, i) => (
            <div key={a.id} className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div className="overflow-hidden rounded-2xl">
                <img src={a.image} alt={a.name} loading="lazy" className="h-80 w-full object-cover sm:h-[420px]" />
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold-dark">
                  <MapPin className="h-3.5 w-3.5" /> {a.distance_km} km from Viom's Paradise
                </p>
                <h2 className="mt-3 font-display text-3xl text-forest-900 sm:text-4xl">{a.name}</h2>
                <p className="mt-4 max-w-lg leading-relaxed text-forest-900/65">{a.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
