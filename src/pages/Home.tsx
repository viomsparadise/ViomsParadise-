import { Hero } from "@/components/home/Hero";
import { FeaturedRooms } from "@/components/home/FeaturedRooms";
import { Highlights } from "@/components/home/Highlights";
import { ReviewsPreview } from "@/components/home/ReviewsPreview";
import { AttractionsPreview } from "@/components/home/AttractionsPreview";


export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedRooms />
      <Highlights />
      <ReviewsPreview />
      <AttractionsPreview />
    </>
  );
}
