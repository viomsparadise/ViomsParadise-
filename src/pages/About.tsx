import { PageHeader } from "@/components/layout/PageHeader";
import { NearbyRestaurants } from "@/components/shared/NearbyRestaurants";
import heroImage from "@/assets/img/img1.jpg";
import img2 from "@/assets/img/img2.jpeg";
import img3 from "@/assets/img/img3.jpeg";
import img4 from "@/assets/img/img4.jpeg";

export default function About() {
  return (
    <>
      <PageHeader
        eyebrow="Our Story"
        title="About Viom's Paradise"
        description="A private hillside home, opened to guests who want the same quiet we built it for."
        image={heroImage}
      />

   
 




      <section className="bg-ivory py-20 sm:py-28">
        <div className="container-luxe grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow">How It Began</p>
            <h2 className="mt-3 font-display text-3xl text-forest-900 sm:text-4xl">Built as a home first.</h2>
            <p className="mt-6 leading-relaxed text-forest-900/70">
              Viom's Paradise started as a family home on a hillside above Siliguri, bordered by tea
              gardens and forest reserve. Over time, the space we'd built for ourselves — two bedrooms,
              a proper kitchen, a living room that opens onto the hills — became something worth sharing
              with other families and travellers, without losing the reason we built it this way in the
              first place.
            </p>
            <p className="mt-4 leading-relaxed text-forest-900/70">
              We kept it a single homestay on purpose, not a hotel with rooms to fill. When you book,
              the whole property is yours — nobody else's stay overlaps with yours, and you get the
              same hillside, the same quiet, and the same kitchen we'd want if we were the ones staying.
            </p>
          </div>
          <div>
            <p className="eyebrow">What To Expect</p>
            <h2 className="mt-3 font-display text-3xl text-forest-900 sm:text-4xl">A stay, not a stopover.</h2>
            <p className="mt-6 leading-relaxed text-forest-900/70">
              There's no restaurant, no spa menu, no events hall. What there is: private balconies over
              tea gardens, warm timber interiors, a team that keeps things running quietly, and a
              hillside that changes character from morning mist to evening light.
            </p>
            <NearbyRestaurants className="mt-8" />
          </div>
        </div>
      </section>

     <section className="container-luxe py-20">
  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
    {[img2, img3, img4].map((src, i) => (
      <div key={i} className="overflow-hidden rounded-2xl shadow-xl">
        <img
          src={src}
          alt={`Viom's Paradise ${i + 1}`}
          className="h-80 w-full object-cover transition-transform duration-500 hover:scale-110"
          loading="lazy"
        />
      </div>
    ))}
  </div>
</section>
    </>
  );
}
