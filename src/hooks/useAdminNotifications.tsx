import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Database } from "@/lib/database.types";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const SOUND_DATA_URI =
  "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAgD4AAIA+AAABAAgAZGF0YQoAAACAgICAgICAgIA=";

export function useAdminNotifications() {
  const { isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const refetch = useCallback(async () => {
    if (!isAdmin) return setLoading(false);
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setNotifications(data ?? []);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Realtime: a new notification row is created the instant a guest's
  // payment is confirmed — this listens for that and updates the badge/list
  // without any page refresh, and plays a short sound as a heads-up.
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          audioRef.current?.play().catch(() => {
            // Autoplay can be blocked until the admin interacts with the page once — the visual badge still updates regardless.
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications" },
        (payload) => {
          const deleted = payload.old as Notification;
          setNotifications((prev) => prev.filter((n) => n.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  async function markRead(id: string, isRead: boolean) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: isRead } : n)));
    await supabase.from("notifications").update({ is_read: isRead }).eq("id", id);
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
  }

  async function remove(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  }

  return {
    notifications,
    unreadCount,
    loading,
    refetch,
    markRead,
    markAllRead,
    remove,
    audioElement: <audio ref={audioRef} src={SOUND_DATA_URI} preload="auto" />,
  };
}
