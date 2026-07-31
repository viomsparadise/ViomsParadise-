import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminStatCard({ label, value, icon, accent }: { label: string; value: string | number; icon: ReactNode; accent?: string }) {
  return (
    <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", accent ?? "bg-gold/15 text-gold-dark")}>{icon}</div>
      <p className="mt-4 font-display text-2xl text-forest-900">{value}</p>
      <p className="text-xs text-forest-900/50">{label}</p>
    </div>
  );
}

export function AdminSectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-forest-900/50">{description}</p>}
      </div>
      {action}
    </div>
  );
}
