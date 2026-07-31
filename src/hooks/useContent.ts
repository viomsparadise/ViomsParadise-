import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { storageUrl } from "@/lib/utils";
import { DEMO_REVIEWS, DEMO_ATTRACTIONS, DEMO_FAQS, DEMO_GALLERY } from "@/data/demoContent";

interface ReviewItem {
  id: string;
  guest_name: string;
  rating: number;
  title: string;
  comment: string;
  room_name: string;
  isDemo?: boolean;
}

export function useApprovedReviews(roomId?: string) {
  const [reviews, setReviews] = useState<ReviewItem[]>(DEMO_REVIEWS.map((r) => ({ ...r, isDemo: true })));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      let query = supabase.from("reviews").select("*, rooms(name)").eq("is_approved", true).order("created_at", { ascending: false });
      if (roomId) query = query.eq("room_id", roomId);
      const { data, error } = await query;
      if (!active) return;
      if (error || !data || data.length === 0) return setLoading(false);
      setReviews(
        data.map((r: any) => ({
          id: r.id,
          guest_name: r.guest_name,
          rating: r.rating,
          title: r.title ?? "",
          comment: r.comment,
          room_name: r.rooms?.name ?? "",
        }))
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [roomId]);

  return { reviews, loading };
}

export function useAttractions() {
  const [attractions, setAttractions] = useState(DEMO_ATTRACTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from("attractions").select("*").eq("is_active", true).order("sort_order");
      if (!active) return;
      if (error || !data || data.length === 0) return setLoading(false);
      setAttractions(
        data.map((a: any) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          distance_km: a.distance_km,
          image: storageUrl(a.storage_path ?? ""),
        }))
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { attractions, loading };
}

export function useFaqs() {
  const [faqs, setFaqs] = useState(DEMO_FAQS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from("faqs").select("*").eq("is_active", true).order("sort_order");
      if (!active) return;
      if (error || !data || data.length === 0) return setLoading(false);
      setFaqs(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { faqs, loading };
}

export function useGallery() {
  const [images, setImages] = useState(DEMO_GALLERY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*, gallery_categories(name)")
        .order("sort_order");
      if (!active) return;
      if (error || !data || data.length === 0) return setLoading(false);
      setImages(
        data.map((g: any) => ({
          id: g.id,
          category: g.gallery_categories?.name ?? "General",
          storage_path: storageUrl(g.storage_path),
        }))
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { images, loading };
}
