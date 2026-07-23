import { useEffect, useState } from "react";
import { AdminSectionHeader } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, Trash2, Star, Loader2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { storageUrl } from "@/lib/utils";
import { toast } from "sonner";

interface GalleryImage {
  id: string;
  storage_path: string;
  caption: string | null;
  is_featured: boolean;
  category_id: string | null;
}
interface Category {
  id: string;
  name: string;
}

export default function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [newCategory, setNewCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data: imgs }, { data: cats }] = await Promise.all([
      supabase.from("gallery_images").select("*").order("sort_order"),
      supabase.from("gallery_categories").select("*").order("sort_order"),
    ]);
    setImages(imgs ?? []);
    setCategories(cats ?? []);
    if (cats && cats.length > 0 && !activeCategory) setActiveCategory(cats[0].id);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addCategory() {
    if (!newCategory.trim()) return;
    const { error } = await supabase.from("gallery_categories").insert({ name: newCategory.trim() });
    if (error) return toast.error(error.message);
    setNewCategory("");
    load();
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const path = `${activeCategory || "general"}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("gallery").upload(path, file);
      if (uploadError) {
        toast.error(uploadError.message);
        continue;
      }
      await supabase.from("gallery_images").insert({
        storage_path: `gallery/${path}`,
        category_id: activeCategory || null,
      });
    }
    setUploading(false);
    toast.success("Images uploaded");
    load();
  }

  async function toggleFeatured(img: GalleryImage) {
    await supabase.from("gallery_images").update({ is_featured: !img.is_featured }).eq("id", img.id);
    load();
  }

  async function deleteImage(id: string) {
    if (!window.confirm("Delete this image?")) return;
    const { error } = await supabase.from("gallery_images").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div>
      <AdminSectionHeader title="Gallery Management" description="Upload and organize property photography by category." />

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-forest-900/10 bg-white p-5 shadow-soft">
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-semibold uppercase tracking-wide text-forest-900/50">Category</label>
          <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-forest-900/15 bg-white px-3 text-sm">
            <option value="">Uncategorized</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Input placeholder="New category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-48" />
          <Button variant="outline" onClick={addCategory}><Plus className="h-4 w-4" /> Add</Button>
        </div>
        <label className="ml-auto cursor-pointer">
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          <span className="inline-flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-forest-950">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Upload Images
          </span>
        </label>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-forest-900/50">Loading gallery…</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-xl">
              <img src={storageUrl(img.storage_path)} className="aspect-square w-full object-cover" />
              <div className="absolute inset-0 flex items-end justify-end gap-1.5 bg-gradient-to-t from-forest-950/70 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => toggleFeatured(img)} className="rounded-full bg-ivory/90 p-2">
                  <Star className={`h-3.5 w-3.5 ${img.is_featured ? "fill-gold text-gold" : "text-forest-900/50"}`} />
                </button>
                <button onClick={() => deleteImage(img.id)} className="rounded-full bg-ivory/90 p-2">
                  <Trash2 className="h-3.5 w-3.5 text-ember" />
                </button>
              </div>
            </div>
          ))}
          {images.length === 0 && <p className="col-span-full text-sm text-forest-900/40">No images uploaded yet.</p>}
        </div>
      )}
    </div>
  );
}
