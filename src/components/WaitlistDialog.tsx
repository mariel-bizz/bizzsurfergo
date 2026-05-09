import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { upsertHubspotWaitlistContact } from "@/lib/hubspot.functions";
import { toast } from "sonner";
import { Rocket, CheckCircle2, Pencil, Mail, Briefcase, Building2, User, Trophy, Sparkles } from "lucide-react";

// XP gamification — earned for joining the waitlist; next milestone is the Executive badge.
const XP_EARNED = 50;
const XP_NEXT_BADGE = 200;
const NEXT_BADGE_NAME = "Executive";

type WaitlistForm = { name: string; email: string; role: string; company: string };

export function WaitlistDialog({ open, onOpenChange, onJoined }: {
  open: boolean; onOpenChange: (v: boolean) => void; onJoined?: () => void;
}) {
  const [form, setForm] = useState<WaitlistForm>({ name: "", email: "", role: "", company: "" });
  const [savedProfile, setSavedProfile] = useState<WaitlistForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const syncHubspot = useServerFn(upsertHubspotWaitlistContact);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setLoading(true);
    const { error } = await supabase.from("waitlist").insert({
      name: form.name, email: form.email, role: form.role || null, company: form.company || null,
    });
    if (error) {
      setLoading(false);
      if (error.code === "23505") { toast.error("This email is already on the list."); return; }
      toast.error("Something went wrong. Try again.");
      return;
    }
    try {
      await syncHubspot({ data: { name: form.name, email: form.email, role: form.role || null, company: form.company || null } });
    } catch (err) {
      console.warn("HubSpot sync failed", err);
    }
    setLoading(false);
    setSavedProfile({ ...form });
    setDone(true);
    onJoined?.();
    toast.success("You're on the list! +50 XP earned.");
  };

  const handleEdit = () => {
    if (savedProfile) setForm(savedProfile);
    setDone(false);
  };

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      // reset after close animation
      setTimeout(() => {
        setDone(false);
        setSavedProfile(null);
        setForm({ name: "", email: "", role: "", company: "" });
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm rounded-3xl">
        {done && savedProfile ? (
          <div className="py-2">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="mt-3 text-xl font-bold">You're on the list</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We'll email <span className="font-medium text-foreground">{savedProfile.email}</span> when BizzSurfer Agentic AI launches.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-soft">
                    <Trophy className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Next badge</div>
                    <div className="text-sm font-bold">{NEXT_BADGE_NAME}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-primary font-bold text-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  +{XP_EARNED} XP
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-primary transition-all"
                  style={{ width: `${Math.min(100, (XP_EARNED / XP_NEXT_BADGE) * 100)}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground font-medium">
                <span>{XP_EARNED} / {XP_NEXT_BADGE} XP</span>
                <span>{XP_NEXT_BADGE - XP_EARNED} XP to go</span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border bg-muted/30 p-4 space-y-2.5">
              <ProfileRow icon={<User className="w-4 h-4" />} label="Name" value={savedProfile.name} />
              <ProfileRow icon={<Mail className="w-4 h-4" />} label="Email" value={savedProfile.email} />
              <ProfileRow icon={<Briefcase className="w-4 h-4" />} label="Role" value={savedProfile.role || "—"} />
              <ProfileRow icon={<Building2 className="w-4 h-4" />} label="Company" value={savedProfile.company || "—"} />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button variant="outline" onClick={handleEdit} className="h-11 font-semibold">
                <Pencil className="w-4 h-4" /> Edit & resubmit
              </Button>
              <Button onClick={() => handleClose(false)} className="h-11 bg-gradient-primary font-bold">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft mb-2">
                <Rocket className="w-5 h-5 text-primary-foreground" />
              </div>
              <DialogTitle className="text-xl">
                {savedProfile ? "Update your details" : "Join the Agentic AI waitlist"}
              </DialogTitle>
              <DialogDescription>
                {savedProfile
                  ? "Make changes and resubmit to update your spot."
                  : "Get early access when BizzSurfer Agentic AI launches."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3 mt-2">
              <div>
                <Label htmlFor="name" className="text-xs font-semibold">Full name</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email" className="text-xs font-semibold">Work email</Label>
                <Input id="email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="role" className="text-xs font-semibold">Role</Label>
                  <Input id="role" placeholder="CHRO" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="company" className="text-xs font-semibold">Company</Label>
                  <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="mt-1" />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-primary font-bold mt-2">
                {loading ? "Saving..." : savedProfile ? "Resubmit" : "Join waitlist"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
        <div className="font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
