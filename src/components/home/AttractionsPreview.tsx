import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttractions } from "@/hooks/useContent";

export function AttractionsPreview() {
  const { attractions } = useAttractions();

  return (
    <section className="bg-ivory py-24 sm:py-32">
      <div className="container-luxe">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Beyond the Property</p>
            <h2 className="mt-3 max-w-xl text-balance font-display text-4xl text-forest-900 sm:text-5xl">
              Worth stepping out for.
            </h2>
          </div>
          <Link to="/attractions" className="shrink-0">
            <Button variant="outline">See All Attractions <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {attractions.slice(0, 4).map((a) => (
            <div key={a.id} className="group overflow-hidden rounded-2xl">
              <div className="aspect-[3/4] overflow-hidden rounded-2xl">
                <img src={a.image} alt={a.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="mt-4">
                <p className="font-display text-base text-forest-900">{a.name}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-forest-900/50">
                  <MapPin className="h-3 w-3" /> {a.distance_km} km away
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
