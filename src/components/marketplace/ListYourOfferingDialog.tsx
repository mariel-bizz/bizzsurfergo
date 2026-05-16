import { useState } from "react";
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
import { submitListingApplication } from "@/lib/marketplace-listing.functions";
import { toast } from "sonner";
import { CheckCircle2, Sparkles } from "lucide-react";

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
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const submitFn = useServerFn(submitListingApplication);

  const reset = () => {
    setForm({
      name: "",
      email: "",
      company: "",
      offeringType: "Agent",
      title: "",
      description: "",
      website: "",
    });
    setDone(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.title || form.description.trim().length < 10) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      await submitFn({
        data: {
          name: form.name,
          email: form.email,
          company: form.company || null,
          offeringType: form.offeringType,
          title: form.title,
          description: form.description,
          website: form.website || null,
        },
      });
      setDone(true);
      toast.success("Application sent! We'll be in touch.");
      setTimeout(() => {
        onOpenChange(false);
        reset();
      }, 1800);
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {done ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
            <h3 className="text-lg font-bold text-foreground">Application sent</h3>
            <p className="text-sm text-muted-foreground">
              Thanks! The BizzSurfer team will review your offering and reach out at{" "}
              <span className="font-semibold text-foreground">{form.email}</span>.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                List your offering
              </DialogTitle>
              <DialogDescription>
                Submit your agent, service, or playbook for review by the BizzSurfer
                team. We'll respond to <span className="font-semibold">info@bizzsurfer.com</span>.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lyo-name">Name *</Label>
                  <Input
                    id="lyo-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    maxLength={200}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lyo-email">Email *</Label>
                  <Input
                    id="lyo-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    maxLength={320}
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
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://"
                  maxLength={500}
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
                className="w-full h-11 font-bold"
              >
                {loading ? "Sending…" : "Send application"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
