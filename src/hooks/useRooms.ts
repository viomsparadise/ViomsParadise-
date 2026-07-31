import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { storageUrl } from "@/lib/utils";
import { DEMO_ROOMS, type DemoRoom } from "@/data/demoContent";

export interface RoomListItem extends DemoRoom {
  isDemo?: boolean;
}

export function useRooms() {
  const [rooms, setRooms] = useState<RoomListItem[]>(DEMO_ROOMS.map((r) => ({ ...r, isDemo: true })));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      // Ordered the same way AdminHomestay.tsx picks the row it edits
      // (oldest by created_at) — this MUST match exactly, or the admin
      // could be editing a different row than guests actually see.
      const { data, error } = await supabase
        .from("rooms_public")
        .select("*, room_images(storage_path, sort_order)")
        .order("created_at", { ascending: true });

      if (!active) return;
      if (error || !data || data.length === 0) {
        setLoading(false);
        return;
      }

      const mapped: RoomListItem[] = data.map((r: any) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        short_description: r.short_description,
        description: r.description,
        price_per_night: r.price_per_night,
        max_guests: r.max_guests,
        bed_config: r.bed_config ?? "",
        size_sqft: r.size_sqft ?? 0,
        amenities: r.amenities ?? [],
        is_featured: r.is_featured,
        total_units: r.total_units,
        images: (r.room_images ?? [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((img: any) => storageUrl(img.storage_path)),
        avg_rating: r.avg_rating ?? 0,
        review_count: r.review_count ?? 0,
      }));
      setRooms(mapped);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { rooms, loading };
}

export function useRoom(slug: string | undefined) {
  const { rooms, loading } = useRooms();
  const room = rooms.find((r) => r.slug === slug);
  return { room, loading };
}
