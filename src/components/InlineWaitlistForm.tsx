import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { upsertHubspotWaitlistContact } from "@/lib/hubspot.functions";
import { toast } from "sonner";
import { Rocket, CheckCircle2, Globe2, ArrowRight } from "lucide-react";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "pt", label: "Português" },
  { value: "it", label: "Italiano" },
  { value: "nl", label: "Nederlands" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
];

export function InlineWaitlistForm({ onJoined }: { onJoined?: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", role: "", company: "", language: "en" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const syncHubspot = useServerFn(upsertHubspotWaitlistContact);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setLoading(true);
    const langLabel = LANGUAGES.find((l) => l.value === form.language)?.label ?? "English";
    const companyWithLang = form.company
      ? `${form.company} · Lang: ${langLabel}`
      : `Lang: ${langLabel}`;

    const { error } = await supabase.from("waitlist").insert({
      name: form.name,
      email: form.email,
      role: form.role || null,
      company: companyWithLang,
    });
    if (error) {
      setLoading(false);
      if (error.code === "23505") { toast.error("This email is already on the list."); return; }
      toast.error("Something went wrong. Try again.");
      return;
    }
    try {
      await syncHubspot({ data: { name: form.name, email: form.email, role: form.role || null, company: companyWithLang } });
    } catch (err) {
      console.warn("HubSpot sync failed", err);
    }
    setLoading(false);
    setDone(true);
    onJoined?.();
    toast.success(`You're on the list! We'll reach out in ${langLabel}.`);
  };

  if (done) {
    return (
      <div className="rounded-3xl bg-card border border-border shadow-card p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h3 className="mt-3 text-lg font-bold">You're on the list</h3>
        <p className="text-sm text-muted-foreground mt-1">We'll be in touch in your preferred language.</p>
        <Button variant="outline" className="mt-4" onClick={() => { setDone(false); setForm({ name: "", email: "", role: "", company: "", language: "en" }); }}>
          Submit another
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-card border border-border shadow-card p-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
          <Rocket className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold leading-tight">Get early access</h2>
          <p className="text-xs text-muted-foreground">Tell us about you and pick your language.</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3 mt-4">
        <div>
          <Label htmlFor="il-name" className="text-xs font-semibold">Full name</Label>
          <Input id="il-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="il-email" className="text-xs font-semibold">Work email</Label>
          <Input id="il-email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="il-role" className="text-xs font-semibold">Role</Label>
            <Input id="il-role" placeholder="CHRO" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="il-company" className="text-xs font-semibold">Company</Label>
            <Input id="il-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="mt-1" />
          </div>
        </div>
        <div>
          <Label htmlFor="il-language" className="text-xs font-semibold flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5" /> Preferred language
          </Label>
          <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
            <SelectTrigger id="il-language" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-primary font-bold mt-2">
          {loading ? "Submitting..." : (<>Join the waitlist <ArrowRight className="ml-1 w-4 h-4" /></>)}
        </Button>
      </form>
    </div>
  );
}
