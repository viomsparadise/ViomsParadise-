import { useState } from "react";
import { Phone, Mail, MapPin, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/lib/supabase";

export default function Contact() {
  const { settings } = useSiteSettings();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const waLink = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent("Hi Viom's Paradise, I have a question about booking a stay.")}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert(form);
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Message sent — we'll get back to you shortly.");
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  }

  return (
    <>
      <PageHeader eyebrow="Get in Touch" title="Contact Us" description="Questions about a stay, or something else entirely — we're happy to help." />

      <section className="bg-ivory py-16 sm:py-24">
        <div className="container-luxe grid grid-cols-1 gap-14 lg:grid-cols-2">
          <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <a href={`tel:${settings.phone_number}`} className="flex items-center gap-4 rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft transition-shadow hover:shadow-luxury">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-800 text-ivory"><Phone className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs font-semibold uppercase text-forest-900/40">Call Us</p>
                  <p className="font-display text-lg text-forest-900">{settings.phone_number}</p>
                </div>
              </a>
              <a href={waLink} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft transition-shadow hover:shadow-luxury">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white"><MessageCircle className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs font-semibold uppercase text-forest-900/40">WhatsApp</p>
                  <p className="font-display text-lg text-forest-900">Message Us</p>
                </div>
              </a>
              <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-4 rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft transition-shadow hover:shadow-luxury">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-forest-950"><Mail className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs font-semibold uppercase text-forest-900/40">Email</p>
                  <p className="font-display text-lg text-forest-900">{settings.contact_email}</p>
                </div>
              </a>
              <a href={settings.google_maps_link} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-2xl border border-forest-900/10 bg-white p-6 shadow-soft transition-shadow hover:shadow-luxury">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ember text-ivory"><MapPin className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs font-semibold uppercase text-forest-900/40">Location</p>
                  <p className="font-display text-lg text-forest-900">Get Directions</p>
                </div>
              </a>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-forest-900/10">
              <iframe
                title="Viom's Paradise location"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`}
                className="h-80 w-full"
                loading="lazy"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-forest-900/10 bg-sand-100 p-8">
            <h3 className="font-display text-2xl text-forest-900">Send a Message</h3>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-1.5" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1.5" />
              </div>
            </div>
            <Button type="submit" variant="gold" className="mt-6 w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Message"}
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
