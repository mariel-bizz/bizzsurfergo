import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { submitListingApplication } from "@/lib/marketplace-listing.functions";
import { toast } from "sonner";
import { CheckCircle2, Sparkles, ExternalLink } from "lucide-react";

type OfferingType = "Agent" | "Service" | "Playbook" | "Template" | "Other";

export function ListYourOfferingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    offeringType: "Agent" as OfferingType,
    title: "",
    description: "",
    website: "",
    honeypot: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resultToken, setResultToken] = useState<string | null>(null);
  const openedAtRef = useRef<number>(0);
  const submitFn = useServerFn(submitListingApplication);

  // Reset opened-at timer when dialog opens
  if (open && openedAtRef.current === 0) {
    openedAtRef.current = Date.now();
  }

  const reset = () => {
    setForm({
      name: "",
      email: "",
      company: "",
      offeringType: "Agent",
      title: "",
      description: "",
      website: "",
      honeypot: "",
    });
    setDone(false);
    setResultToken(null);
    openedAtRef.current = 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.title || form.description.trim().length < 10) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const elapsedMs = openedAtRef.current
      ? Date.now() - openedAtRef.current
      : 0;
    if (elapsedMs > 0 && elapsedMs < 2000) {
      toast.error("Please take a moment to review your submission.");
      return;
    }

    setLoading(true);
    try {
      const result = await submitFn({
        data: {
          name: form.name,
          email: form.email,
          company: form.company || null,
          offeringType: form.offeringType,
          title: form.title,
          description: form.description,
          website: form.website || null,
          honeypot: form.honeypot,
          elapsedMs,
          userAgent:
            typeof navigator !== "undefined"
              ? navigator.userAgent.slice(0, 1024)
              : null,
        },
      });
      setDone(true);
      setResultToken(result.token);
      toast.success("Application sent — check your inbox!");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent
        className="
          w-[calc(100vw-1rem)] sm:max-w-lg
          max-h-[calc(100dvh-2rem)] sm:max-h-[90vh]
          overflow-y-auto p-4 sm:p-6 rounded-2xl
        "
      >
        {done ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
            <h3 className="text-lg font-bold text-foreground">Application sent</h3>
            <p className="text-sm text-muted-foreground">
              Thanks! We've emailed a receipt to{" "}
              <span className="font-semibold text-foreground">{form.email}</span>.
              Our team will review your submission within 3–5 business days.
            </p>
            {resultToken ? (
              <Button asChild variant="outline" className="w-full mt-2">
                <Link
                  to="/marketplace/application/$token"
                  params={{ token: resultToken }}
                  onClick={() => {
                    onOpenChange(false);
                    reset();
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Track application status
                </Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="w-5 h-5 text-primary" />
                List your offering
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Submit your agent, service, or playbook for review. We'll reach out
                from <span className="font-semibold">info@bizzsurfer.com</span>.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3 mt-3">
              {/* Honeypot — must stay empty. Hidden from real users + bots that auto-fill */}
              <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="lyo-hp">Leave this field empty</label>
                <input
                  id="lyo-hp"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.honeypot}
                  onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lyo-name">Name *</Label>
                  <Input
                    id="lyo-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    maxLength={200}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lyo-email">Email *</Label>
                  <Input
                    id="lyo-email"
                    type="email"
                    inputMode="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    maxLength={320}
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lyo-company">Company</Label>
                <Input
                  id="lyo-company"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  maxLength={200}
                  autoComplete="organization"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lyo-type">Offering type *</Label>
                  <Select
                    value={form.offeringType}
                    onValueChange={(v) =>
                      setForm({ ...form, offeringType: v as OfferingType })
                    }
                  >
                    <SelectTrigger id="lyo-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Agent">Agent</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                      <SelectItem value="Playbook">Playbook</SelectItem>
                      <SelectItem value="Template">Template</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lyo-title">Title *</Label>
                  <Input
                    id="lyo-title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. RevOps Copilot"
                    required
                    maxLength={200}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lyo-website">Website / link</Label>
                <Input
                  id="lyo-website"
                  type="url"
                  inputMode="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://"
                  maxLength={500}
                  autoComplete="url"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lyo-desc">Description *</Label>
                <Textarea
                  id="lyo-desc"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="What does it do, who is it for, and what outcomes does it deliver?"
                  rows={4}
                  required
                  minLength={10}
                  maxLength={5000}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 font-bold mt-1"
              >
                {loading ? "Sending…" : "Send application"}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                By submitting you agree to be contacted at the email above.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
