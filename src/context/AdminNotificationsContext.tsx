import { createContext, useContext, type ReactNode } from "react";
import { useAdminNotifications, type Notification } from "@/hooks/useAdminNotifications";

interface AdminNotificationsValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refetch: () => Promise<void>;
  markRead: (id: string, isRead: boolean) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const AdminNotificationsContext = createContext<AdminNotificationsValue | undefined>(undefined);

export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const { audioElement, ...value } = useAdminNotifications();
  return (
    <AdminNotificationsContext.Provider value={value}>
      {children}
      {audioElement}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotificationsContext() {
  const ctx = useContext(AdminNotificationsContext);
  if (!ctx) throw new Error("useAdminNotificationsContext must be used within AdminNotificationsProvider");
  return ctx;
}
