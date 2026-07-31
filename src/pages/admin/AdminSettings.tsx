import { useEffect, useState } from "react";
import { AdminSectionHeader } from "@/components/admin/AdminUI";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Save, UploadCloud, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { storageUrl } from "@/lib/utils";
import { toast } from "sonner";

interface FormState {
  business_name: string;
  tagline: string;
  logo_path: string;
  phone_number: string;
  whatsapp_number: string;
  address: string;
  contact_email: string;
  google_maps_link: string;
  social_instagram: string;
  social_facebook: string;
  check_in_time: string;
  check_out_time: string;
  cancellation_free_hours: number;
  tax_percent: number;
}

export default function AdminSettings() {
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    supabase.from("site_settings").select("key, value").then(({ data }) => {
      if (!data) return;
      const merged: any = {};
      data.forEach((row) => (merged[row.key] = row.value));
      setForm(merged);
    });
  }, []);

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    const path = `logo-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("branding").upload(path, file, { upsert: true });
    if (uploadError) {
      setUploadingLogo(false);
      return toast.error(uploadError.message);
    }
    const fullPath = `branding/${path}`;
    const { error: settingError } = await supabase.from("site_settings").upsert({ key: "logo_path", value: fullPath });
    setUploadingLogo(false);
    if (settingError) return toast.error(settingError.message);
    setForm((prev) => (prev ? { ...prev, logo_path: fullPath } : prev));
    toast.success("Logo updated");
  }

  async function handleLogoDelete() {
    if (!form?.logo_path) return;
    if (!window.confirm("Remove the logo? The site will fall back to the text wordmark.")) return;
    const objectPath = form.logo_path.replace(/^branding\//, "");
    await supabase.storage.from("branding").remove([objectPath]);
    const { error } = await supabase.from("site_settings").upsert({ key: "logo_path", value: "" });
    if (error) return toast.error(error.message);
    setForm((prev) => (prev ? { ...prev, logo_path: "" } : prev));
    toast.success("Logo removed");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const updates = Object.entries(form).map(([key, value]) => supabase.from("site_settings").upsert({ key, value }));
    const results = await Promise.all(updates);
    setSaving(false);
    const failed = results.find((r) => r.error);
    if (failed?.error) return toast.error(failed.error.message);
    toast.success("Website settings updated");
  }

  if (!form) return <p className="text-sm text-forest-900/50">Loading settings…</p>;

  const set = (key: keyof FormState, value: any) => setForm({ ...form, [key]: value });

  return (
    <div>
      <AdminSectionHeader title="Website Settings" description="These values control content across the entire public website." />

      <form onSubmit={handleSave} className="max-w-2xl space-y-8">
        <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg text-forest-900">Logo</h2>
          <p className="mt-1 text-sm text-forest-900/50">Upload a logo to replace the text wordmark in the navbar and footer. Leave empty to keep the text version.</p>
          <div className="mt-4 flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-forest-900/10 bg-sand-100">
              {form.logo_path ? (
                <img src={storageUrl(form.logo_path)} alt="Current logo" className="h-full w-full object-contain" />
              ) : (
                <span className="text-[10px] text-forest-900/30">No logo</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                />
                <span className="inline-flex h-10 items-center gap-2 rounded-full border border-forest-900/15 px-4 text-xs font-semibold text-forest-800 hover:bg-forest-900/5">
                  {uploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                  {form.logo_path ? "Replace Logo" : "Upload Logo"}
                </span>
              </label>
              {form.logo_path && (
                <button type="button" onClick={handleLogoDelete} className="inline-flex h-10 items-center gap-2 rounded-full border border-forest-900/15 px-4 text-xs font-semibold text-ember hover:bg-ember/5">
                  <Trash2 className="h-3.5 w-3.5" /> Remove Logo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg text-forest-900">Business Identity</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Business Name</Label>
              <Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className="mt-2" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg text-forest-900">Contact Details</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Phone Number</Label>
              <Input value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>WhatsApp Number (with country code, no +)</Label>
              <Input value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} className="mt-2" />
            </div>
          </div>
          <div className="mt-4">
            <Label>Address</Label>
            <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} className="mt-2" />
          </div>
          <div className="mt-4">
            <Label>Google Maps Link</Label>
            <Input value={form.google_maps_link} onChange={(e) => set("google_maps_link", e.target.value)} className="mt-2" />
          </div>
        </div>

        <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg text-forest-900">Social Media</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Instagram URL</Label>
              <Input value={form.social_instagram} onChange={(e) => set("social_instagram", e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Facebook URL</Label>
              <Input value={form.social_facebook} onChange={(e) => set("social_facebook", e.target.value)} className="mt-2" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg text-forest-900">Stay Policies</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label>Check-in Time</Label>
              <Input value={form.check_in_time} onChange={(e) => set("check_in_time", e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Check-out Time</Label>
              <Input value={form.check_out_time} onChange={(e) => set("check_out_time", e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Free Cancellation (hrs)</Label>
              <Input type="number" value={form.cancellation_free_hours} onChange={(e) => set("cancellation_free_hours", Number(e.target.value))} className="mt-2" />
            </div>
            <div>
              <Label>Tax (%)</Label>
              <Input type="number" value={form.tax_percent} onChange={(e) => set("tax_percent", Number(e.target.value))} className="mt-2" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gold/25 bg-gold/10 p-5 text-sm text-forest-800">
          Since there's no in-house restaurant, the site shows a <strong>Search Nearby Restaurants</strong> link
          across the Home, Rooms, Room Details, About, and Booking Confirmation pages instead — it opens a
          Google Maps search near your business address above, so keep that address accurate.
        </div>

        <Button type="submit" variant="gold" size="lg" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Settings
        </Button>
      </form>
    </div>
  );
}
