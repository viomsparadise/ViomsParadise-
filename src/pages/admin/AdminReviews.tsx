import { useEffect, useState } from "react";
import { AdminSectionHeader } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface ReviewRow {
  id: string;
  guest_name: string;
  rating: number;
  title: string | null;
  comment: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  rooms: { name: string } | null;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("reviews").select("*, rooms(name)").order("created_at", { ascending: false });
    setReviews((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = reviews.filter((r) => (filter === "all" ? true : filter === "pending" ? !r.is_approved : r.is_approved));

  async function setApproved(id: string, value: boolean) {
    const { error } = await supabase.from("reviews").update({ is_approved: value }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(value ? "Review approved" : "Review rejected");
    load();
  }

  async function toggleFeatured(id: string, value: boolean) {
    await supabase.from("reviews").update({ is_featured: value }).eq("id", id);
    load();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this review permanently?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div>
      <AdminSectionHeader title="Review Management" description="Only approved reviews are shown publicly." />

      <div className="mb-5 flex gap-2">
        {(["pending", "approved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filter === f ? "bg-forest-800 text-ivory" : "bg-white text-forest-800/60"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-forest-900/50">Loading reviews…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-forest-900/40">No reviews in this filter.</p>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-base text-forest-900">{r.guest_name}</p>
                    <Badge variant={r.is_approved ? "success" : "warning"}>{r.is_approved ? "Approved" : "Pending"}</Badge>
                    {r.is_featured && <Badge variant="gold">Featured</Badge>}
                  </div>
                  <p className="text-xs text-forest-900/40">{r.rooms?.name} · {formatDate(r.created_at)}</p>
                  <div className="mt-2 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-gold text-gold" : "text-forest-900/15"}`} />
                    ))}
                  </div>
                  {r.title && <p className="mt-2 font-medium text-forest-900">{r.title}</p>}
                  <p className="mt-1 max-w-2xl text-sm text-forest-900/60">{r.comment}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {!r.is_approved && <Button size="sm" variant="outline" onClick={() => setApproved(r.id, true)}><Check className="h-3.5 w-3.5" /> Approve</Button>}
                  {r.is_approved && <Button size="sm" variant="outline" onClick={() => setApproved(r.id, false)}><X className="h-3.5 w-3.5" /> Unapprove</Button>}
                  <Button size="sm" variant="outline" onClick={() => toggleFeatured(r.id, !r.is_featured)}>
                    <Star className={`h-3.5 w-3.5 ${r.is_featured ? "fill-gold text-gold" : ""}`} /> {r.is_featured ? "Unfeature" : "Feature"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => remove(r.id)} className="text-ember"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
