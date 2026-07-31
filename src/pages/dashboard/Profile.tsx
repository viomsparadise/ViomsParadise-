import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, city, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error("Could not update profile");
    toast.success("Profile updated");
    refreshProfile();
  }

  return (
    <div className="max-w-lg rounded-2xl border border-forest-900/10 bg-white p-8 shadow-soft">
      <h1 className="font-display text-2xl text-forest-900">Profile</h1>
      <p className="mt-1 text-sm text-forest-900/50">Keep your contact details up to date for booking confirmations.</p>

      <form onSubmit={handleSave} className="mt-8 space-y-5">
        <div>
          <Label htmlFor="email">Verified phone number</Label>
          <Input id="email" value={user?.phone ?? profile?.phone ?? ""} disabled className="mt-2 opacity-60" />
        </div>
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-2" />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2" />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-2" />
        </div>
        <Button type="submit" variant="gold" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
        </Button>
      </form>
    </div>
  );
}
