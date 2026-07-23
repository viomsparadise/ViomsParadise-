import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Lightbox } from "@/components/gallery/Lightbox";
import { useGallery } from "@/hooks/useContent";
import { cn } from "@/lib/utils";

export default function Gallery() {
  const { images } = useGallery();
  const [category, setCategory] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = ["All", ...Array.from(new Set(images.map((i) => i.category)))];
  const filtered = useMemo(() => (category === "All" ? images : images.filter((i) => i.category === category)), [images, category]);
  const urls = filtered.map((i) => i.storage_path);

  return (
    <>
      <PageHeader
        eyebrow="Visual Tour"
        title="Gallery"
        description="Rooms, grounds, and the hillside they sit on — a closer look before you arrive."
        image="https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=2000&auto=format&fit=crop"
      />

      <section className="bg-ivory py-16 sm:py-24">
        <div className="container-luxe">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
                  category === c ? "border-forest-800 bg-forest-800 text-ivory" : "border-forest-900/15 text-forest-800/70 hover:border-forest-800"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-10 columns-2 gap-4 sm:columns-3 [&>*]:mb-4">
            {filtered.map((img, i) => (
              <button key={img.id} onClick={() => setLightboxIndex(i)} className="block w-full overflow-hidden rounded-xl">
                <img
                  src={img.storage_path}
                  alt={img.category}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </button>
            ))}
          </div>

          <Lightbox images={urls} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
        </div>
      </section>
    </>
  );
}
