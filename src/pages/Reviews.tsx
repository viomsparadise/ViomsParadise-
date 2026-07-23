import { useState } from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApprovedReviews } from "@/hooks/useContent";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function Reviews() {
  const { reviews, loading } = useApprovedReviews();
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return toast.error("Please sign in to leave a review.");
    if (comment.trim().length < 10) return toast.error("Tell us a little more — at least 10 characters.");

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      guest_name: profile?.full_name || user.phone || "Guest",
      rating,
      title,
      comment,
      is_approved: false,
    });
    setSubmitting(false);

    if (error) return toast.error(error.message);
    setSubmitted(true);
    setTitle("");
    setComment("");
    toast.success("Thank you! Your review will appear once approved.");
  }

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";

  return (
    <>
      <PageHeader
        eyebrow="Guest Words"
        title="Reviews"
        description="Honest words from guests who've stayed on the hillside."
        image="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2000&auto=format&fit=crop"
      />

      <section className="bg-ivory py-16 sm:py-24">
        <div className="container-luxe grid grid-cols-1 gap-16 lg:grid-cols-[1.4fr,1fr]">
          <div>
            <div className="flex items-center gap-4">
              <p className="font-display text-5xl text-forest-900">{avg}</p>
              <div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-gold text-gold" />)}
                </div>
                <p className="mt-1 text-sm text-forest-900/50">{reviews.length} verified reviews</p>
              </div>
            </div>

            <div className="mt-10 space-y-6">
              {loading && reviews.length === 0 && <p className="text-forest-900/50">Loading reviews…</p>}
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-forest-900/8 bg-white p-7 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-gold text-gold" : "text-forest-900/15"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-forest-900/40">{r.room_name}</span>
                  </div>
                  {r.title && <p className="mt-3 font-display text-lg text-forest-900">{r.title}</p>}
                  <p className="mt-2 text-sm leading-relaxed text-forest-900/65">"{r.comment}"</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-forest-900/40">{r.guest_name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-forest-900/10 bg-sand-100 p-8">
              <h3 className="font-display text-xl text-forest-900">Share Your Stay</h3>
              {submitted ? (
                <div className="mt-6 flex items-center gap-3 rounded-xl bg-forest-100 p-5 text-forest-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <p className="text-sm">Thanks — your review is pending approval and will appear here soon.</p>
                </div>
              ) : !user ? (
                <p className="mt-4 text-sm text-forest-900/60">
                  Please <a href="/verify-phone" className="font-semibold text-gold-dark underline">verify your phone number</a> to leave a review of your stay.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <div>
                    <Label>Your Rating</Label>
                    <div className="mt-2 flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button type="button" key={i} onClick={() => setRating(i + 1)}>
                          <Star className={cn("h-6 w-6", i < rating ? "fill-gold text-gold" : "text-forest-900/20")} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="review-title">Title (optional)</Label>
                    <Input id="review-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" placeholder="A quiet escape" />
                  </div>
                  <div>
                    <Label htmlFor="review-comment">Your Review</Label>
                    <Textarea id="review-comment" value={comment} onChange={(e) => setComment(e.target.value)} className="mt-1.5" placeholder="Tell future guests about your stay…" required />
                  </div>
                  <Button type="submit" variant="gold" className="w-full" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Review"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
