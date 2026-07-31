import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, UploadCloud, MapPin } from "lucide-react";
import { AdminSectionHeader } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { storageUrl } from "@/lib/utils";
import { toast } from "sonner";

interface AttractionRow {
  id: string;
  name: string;
  description: string;
  distance_km: number | null;
  storage_path: string | null;
  is_active: boolean;
  sort_order: number;
}

const emptyForm = {
  id: "",
  name: "",
  description: "",
  distance_km: 5,
  is_active: true,
  sort_order: 0,
};

export default function AdminAttractions() {
  const [attractions, setAttractions] = useState<AttractionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("attractions").select("*").order("sort_order");
    setAttractions((data as AttractionRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setForm(emptyForm);
    setPendingImageFile(null);
    setOpen(true);
  }

  function openEdit(a: AttractionRow) {
    setForm({
      id: a.id,
      name: a.name,
      description: a.description,
      distance_km: a.distance_km ?? 0,
      is_active: a.is_active,
      sort_order: a.sort_order,
    });
    setPendingImageFile(null);
    setOpen(true);
  }

  async function uploadImage(file: File) {
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("attractions").upload(path, file);
    if (error) throw error;
    return `attractions/${path}`;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let storagePath: string | undefined;
      if (pendingImageFile) {
        storagePath = await uploadImage(pendingImageFile);
      }

      const payload: any = {
        name: form.name,
        description: form.description,
        distance_km: Number(form.distance_km) || 0,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      };
      if (storagePath) payload.storage_path = storagePath;

      const { error } = form.id
        ? await supabase.from("attractions").update(payload).eq("id", form.id)
        : await supabase.from("attractions").insert(payload);

      if (error) throw error;
      toast.success(form.id ? "Attraction updated" : "Attraction added");
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this attraction permanently?")) return;
    const { error } = await supabase.from("attractions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Attraction deleted");
    load();
  }

  async function toggleActive(a: AttractionRow) {
    const { error } = await supabase.from("attractions").update({ is_active: !a.is_active }).eq("id", a.id);
    if (error) return toast.error(error.message);
    load();
  }

  async function quickReplacePhoto(a: AttractionRow, file: File) {
    setUploadingFor(a.id);
    try {
      const storagePath = await uploadImage(file);
      const { error } = await supabase.from("attractions").update({ storage_path: storagePath }).eq("id", a.id);
      if (error) throw error;
      toast.success("Photo updated");
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploadingFor(null);
    }
  }

  return (
    <div>
      <AdminSectionHeader
        title="Nearby Attractions"
        description="Manage the photos, descriptions, and distances shown on the Attractions page."
        action={<Button variant="gold" onClick={openNew}><Plus className="h-4 w-4" /> Add Attraction</Button>}
      />

      {loading ? (
        <p className="text-sm text-forest-900/50">Loading attractions…</p>
      ) : (
        <div className="space-y-5">
          {attractions.map((a) => (
            <div key={a.id} className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-4">
                  <img
                    src={a.storage_path ? storageUrl(a.storage_path) : "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=300&auto=format&fit=crop"}
                    alt={a.name}
                    className="h-20 w-24 rounded-xl object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-lg text-forest-900">{a.name}</p>
                      <Badge variant={a.is_active ? "success" : "danger"}>{a.is_active ? "Active" : "Hidden"}</Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-sm text-forest-900/50">
                      <MapPin className="h-3.5 w-3.5" /> {a.distance_km} km away
                    </p>
                    <p className="mt-1 max-w-lg text-sm text-forest-900/60">{a.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && quickReplacePhoto(a, e.target.files[0])} />
                    <span className="inline-flex h-9 items-center gap-2 rounded-full border border-forest-900/15 px-4 text-xs font-semibold text-forest-800 hover:bg-forest-900/5">
                      {uploadingFor === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />} Replace Photo
                    </span>
                  </label>
                  <Button variant="outline" size="sm" onClick={() => toggleActive(a)}>
                    {a.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {a.is_active ? "Hide" : "Show"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(a.id)} className="text-ember hover:bg-ember/5"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                </div>
              </div>
            </div>
          ))}
          {attractions.length === 0 && <p className="text-sm text-forest-900/40">No attractions yet — add your first one.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{form.id ? "Edit Attraction" : "Add New Attraction"}</DialogTitle>
          <DialogDescription>Shown on the public Nearby Attractions page and home page preview.</DialogDescription>

          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="distance">Distance (km)</Label>
                <Input id="distance" type="number" min={0} step="0.1" value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: Number(e.target.value) })} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="sort">Display Order</Label>
                <Input id="sort" type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="mt-2" />
              </div>
            </div>
            <div>
              <Label>Photo</Label>
              <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-forest-900/20 px-4 py-3 text-sm text-forest-900/60 hover:bg-forest-900/5">
                <UploadCloud className="h-4 w-4" />
                {pendingImageFile ? pendingImageFile.name : form.id ? "Upload to replace current photo" : "Upload a photo"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setPendingImageFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-forest-800">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Visible on site
            </label>
            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} {form.id ? "Save Changes" : "Add Attraction"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
