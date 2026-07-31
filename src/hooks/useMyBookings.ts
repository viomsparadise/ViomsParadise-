import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Database } from "@/lib/database.types";

export type MyBooking = Database["public"]["Tables"]["bookings"]["Row"] & {
  rooms?: { name: string; slug: string; room_images?: { storage_path: string }[] } | null;
};

export function useMyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) return setLoading(false);
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("*, rooms(name, slug, room_images(storage_path))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setBookings((data as unknown as MyBooking[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { bookings, loading, refetch };
}
