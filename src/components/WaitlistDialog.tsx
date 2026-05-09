import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Rocket, CheckCircle2 } from "lucide-react";

export function WaitlistDialog({ open, onOpenChange, onJoined }: {
  open: boolean; onOpenChange: (v: boolean) => void; onJoined?: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", role: "", company: "" });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    if (!consent) {
      toast.error("Please accept the terms to continue.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("waitlist").insert({
      name: form.name, email: form.email, role: form.role || null, company: form.company || null,
    });
    setLoading(false);
    if (error) {
      if (error.code === "23505") { toast.error("This email is already on the list."); return; }
      toast.error("Something went wrong. Try again.");
      return;
    }
    setDone(true);
    onJoined?.();
    toast.success("You're on the list! +50 XP earned.");
    setTimeout(() => {
      onOpenChange(false); setDone(false);
      setForm({ name: "", email: "", role: "", company: "" });
      setConsent(false);
    }, 1800);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        {done ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="w-14 h-14 text-success mx-auto" />
            <h3 className="mt-3 text-lg font-bold">Welcome aboard!</h3>
            <p className="text-sm text-muted-foreground mt-1">You'll be the first to know when BizzSurfer Agentic AI launches.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft mb-2">
                <Rocket className="w-5 h-5 text-primary-foreground" />
              </div>
              <DialogTitle className="text-xl">Join the Agentic AI waitlist</DialogTitle>
              <DialogDescription>Get early access when BizzSurfer Agentic AI launches.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3 mt-2">
              <p className="text-sm text-foreground bg-muted/50 rounded-lg px-3 py-2">
                Please share your Name, Email and Language to get started! 🙂
              </p>
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
              <div className="flex items-start gap-2 pt-1">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(v) => setConsent(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="consent" className="text-xs leading-snug font-normal text-muted-foreground cursor-pointer">
                  I agree to BizzSurfer's{" "}
                  <a href="https://www.bizzsurfer.com/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">Terms</a>{" "}
                  and{" "}
                  <a href="https://www.bizzsurfer.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Privacy Policy</a>{" "}
                  and consent to be contacted about the launch (GDPR).
                </Label>
              </div>
              <Button type="submit" disabled={loading || !consent} className="w-full h-11 bg-gradient-primary font-bold mt-2">
                {loading ? "Adding you..." : "Join waitlist"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
