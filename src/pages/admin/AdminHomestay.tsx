import { useEffect, useState } from "react";
import { Loader2, Save, UploadCloud, Star, Trash2 } from "lucide-react";
import { AdminSectionHeader } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { storageUrl } from "@/lib/utils";
import { toast } from "sonner";

interface HomestayRow {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  price_per_night: number;
  max_guests: number;
  bed_config: string;
  size_sqft: number | null;
  amenities: string[];
  is_active: boolean;
  total_units: number;
  room_images: { id: string; storage_path: string; is_cover: boolean }[];
}

const emptyForm = {
  name: "Viom's Paradise Homestay",
  slug: "vioms-paradise-homestay",
  short_description: "A peaceful private homestay with 2 bedrooms and a full kitchen, all to yourselves.",
  description: "",
  price_per_night: 6500,
  max_guests: 6,
  bed_config: "2 Bedrooms (1 King + 2 Twin)",
  size_sqft: 900,
  amenities: "2 Bedrooms, Full Kitchen, Bathroom, Free Wi-Fi, Parking, Hot Water, Mountain & Garden View, Family Friendly, Clean & Comfortable Stay",
  is_active: true,
};

// Viom's Paradise is a single homestay, not a hotel with many rooms — so
// this page always edits the one property record (auto-creating it on
// first load if it doesn't exist yet) instead of listing/adding/deleting
// multiple rows like the old room management screen did.
export default function AdminHomestay() {
  const [homestay, setHomestay] = useState<HomestayRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("rooms")
      .select("*, room_images(id, storage_path, is_cover)")
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      // First time setup — create the single homestay record automatically.
      const { data: created, error: createError } = await supabase
        .from("rooms")
        .insert({
          slug: emptyForm.slug,
          name: emptyForm.name,
          short_description: emptyForm.short_description,
          description: emptyForm.description,
          price_per_night: emptyForm.price_per_night,
          max_guests: emptyForm.max_guests,
          bed_config: emptyForm.bed_config,
          size_sqft: emptyForm.size_sqft,
          amenities: emptyForm.amenities.split(",").map((a) => a.trim()),
          is_active: true,
          is_featured: true,
          total_units: 1,
        })
        .select("*, room_images(id, storage_path, is_cover)")
        .single();

      if (createError) {
        toast.error(createError.message);
        setLoading(false);
        return;
      }
      setHomestay(created as unknown as HomestayRow);
      setForm({ ...emptyForm, description: created.description });
      setLoading(false);
      return;
    }

    const row = data as unknown as HomestayRow;
    setHomestay(row);
    setForm({
      name: row.name,
      slug: row.slug,
      short_description: row.short_description,
      description: row.description,
      price_per_night: row.price_per_night,
      max_guests: row.max_guests,
      bed_config: row.bed_config,
      size_sqft: row.size_sqft ?? 0,
      amenities: row.amenities.join(", "),
      is_active: row.is_active,
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!homestay) return;
    setSaving(true);
    const { error } = await supabase
      .from("rooms")
      .update({
        name: form.name,
        slug: form.slug,
        short_description: form.short_description,
        description: form.description,
        price_per_night: Number(form.price_per_night),
        max_guests: Number(form.max_guests),
        bed_config: form.bed_config,
        size_sqft: Number(form.size_sqft) || null,
        amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
        is_active: form.is_active,
      })
      .eq("id", homestay.id);

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Homestay details saved");
    load();
  }

  async function handleImageUpload(file: File, isFirst: boolean) {
    if (!homestay) return;
    setUploadingFor(true);
    const path = `${homestay.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("room-images").upload(path, file);
    if (uploadError) {
      setUploadingFor(false);
      return toast.error(uploadError.message);
    }
    const { error: insertError } = await supabase.from("room_images").insert({
      room_id: homestay.id,
      storage_path: `room-images/${path}`,
      is_cover: isFirst,
    });
    setUploadingFor(false);
    if (insertError) return toast.error(insertError.message);
    toast.success("Photo uploaded");
    load();
  }

  async function setCoverImage(imageId: string) {
    if (!homestay) return;
    await supabase.from("room_images").update({ is_cover: false }).eq("room_id", homestay.id);
    await supabase.from("room_images").update({ is_cover: true }).eq("id", imageId);
    toast.success("Cover photo updated");
    load();
  }

  async function deleteImage(imageId: string) {
    if (!window.confirm("Remove this photo?")) return;
    const { error } = await supabase.from("room_images").delete().eq("id", imageId);
    if (error) return toast.error(error.message);
    load();
  }

  if (loading) {
    return <p className="text-sm text-forest-900/50">Loading homestay details…</p>;
  }

  return (
    <div>
      <AdminSectionHeader
        title="Homestay Details"
        description="Viom's Paradise is booked as a single homestay unit — edit its price, availability, photos, amenities, and description here."
        action={<Badge variant={form.is_active ? "success" : "danger"}>{form.is_active ? "Accepting Bookings" : "Not Accepting Bookings"}</Badge>}
      />

      <form onSubmit={handleSave} className="max-w-2xl space-y-8">
        <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg text-forest-900">Photos</h2>
          <p className="mt-1 text-sm text-forest-900/50">The starred photo is used as the cover image across the site.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {homestay?.room_images.map((img) => (
              <div key={img.id} className="group relative">
                <img src={storageUrl(img.storage_path)} className="h-20 w-20 rounded-lg object-cover" />
                <button type="button" onClick={() => setCoverImage(img.id)} className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-1 shadow">
                  <Star className={`h-3.5 w-3.5 ${img.is_cover ? "fill-gold text-gold" : "text-forest-900/30"}`} />
                </button>
                <button type="button" onClick={() => deleteImage(img.id)} className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 rounded-b-lg bg-forest-950/70 py-1 text-[10px] text-ivory opacity-0 transition-opacity group-hover:opacity-100">
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            ))}
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-forest-900/25 text-forest-900/40 hover:bg-forest-900/5">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], (homestay?.room_images.length ?? 0) === 0)}
              />
              {uploadingFor ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              <span className="text-[10px]">Upload</span>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg text-forest-900">Pricing & Availability</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="price">Price per night (₹)</Label>
              <Input id="price" type="number" min={0} required value={form.price_per_night} onChange={(e) => setForm({ ...form, price_per_night: Number(e.target.value) })} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="guests">Max guests</Label>
              <Input id="guests" type="number" min={1} required value={form.max_guests} onChange={(e) => setForm({ ...form, max_guests: Number(e.target.value) })} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="size">Size (sq ft)</Label>
              <Input id="size" type="number" min={0} value={form.size_sqft} onChange={(e) => setForm({ ...form, size_sqft: Number(e.target.value) })} className="mt-2" />
            </div>
          </div>
          <label className="mt-5 flex items-center gap-2 text-sm text-forest-800">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Accepting bookings (turn off to temporarily hide the homestay from new bookings)
          </label>
        </div>

        <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg text-forest-900">Property Details</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="name">Homestay name</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="bed">Bedroom configuration</Label>
              <Input id="bed" value={form.bed_config} onChange={(e) => setForm({ ...form, bed_config: e.target.value })} className="mt-2" placeholder="e.g. 2 Bedrooms (1 King + 2 Twin)" />
            </div>
            <div>
              <Label htmlFor="short">Short description</Label>
              <Input id="short" required value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="desc">Full description</Label>
              <Textarea id="desc" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 min-h-40" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg text-forest-900">Amenities</h2>
          <p className="mt-1 text-sm text-forest-900/50">Comma-separated — shown as a checklist across the site.</p>
          <Textarea value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} className="mt-3" />
        </div>

        <Button type="submit" variant="gold" size="lg" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Homestay Details
        </Button>
      </form>
    </div>
  );
}
