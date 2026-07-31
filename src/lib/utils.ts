import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, opts: Intl.DateTimeFormatOptions = {}) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", ...opts });
}

export function nightsBetween(checkIn: string | Date, checkOut: string | Date) {
  const a = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const b = typeof checkOut === "string" ? new Date(checkOut) : checkOut;
  const ms = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

/** Public URL for a Supabase Storage object path, e.g. "room-images/xyz.jpg" */
export function storageUrl(bucketAndPath: string) {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  if (!bucketAndPath) return "";
  if (bucketAndPath.startsWith("http")) return bucketAndPath;
  return `${base}/storage/v1/object/public/${bucketAndPath}`;
}
