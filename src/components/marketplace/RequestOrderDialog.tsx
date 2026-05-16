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
import { useServerFn } from "@tanstack/react-start";
import { submitMarketplaceOrder } from "@/lib/marketplace-order.functions";
import { toast } from "sonner";
import { CheckCircle2, ShoppingCart } from "lucide-react";
import { categoryMeta, type Listing } from "@/lib/marketplace-data";
import { clearCart } from "@/lib/marketplace-cart";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  listings: Listing[];
  onSubmitted?: () => void;
};

export function RequestOrderDialog({ open, onOpenChange, listings, onSubmitted }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
    honeypot: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const openedAtRef = useRef<number>(0);
  const submitFn = useServerFn(submitMarketplaceOrder);

  if (open && openedAtRef.current === 0) {
    openedAtRef.current = Date.now();
  }

  const reset = () => {
    setForm({ name: "", email: "", company: "", phone: "", message: "", honeypot: "" });
    setDone(false);
    openedAtRef.current = 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Please share your name and email.");
      return;
    }
    if (listings.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    const elapsedMs = openedAtRef.current ? Date.now() - openedAtRef.current : 0;
    if (elapsedMs > 0 && elapsedMs < 2000) {
      toast.error("Please take a moment to review your request.");
      return;
    }

    setLoading(true);
    try {
      await submitFn({
        data: {
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim() || null,
          phone: form.phone.trim() || null,
          message: form.message.trim() || null,
          items: listings.map((l) => ({
            title: l.title,
            provider: l.provider,
            category: categoryMeta[l.category].label,
          })),
          honeypot: form.honeypot,
          elapsedMs,
        },
      });
      setDone(true);
      clearCart();
      onSubmitted?.();
      toast.success("Request sent — check your inbox!");
    } catch {
      toast.error("Something went wrong. Please try again.");
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
      <DialogContent className="max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl">
        {done ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
            <h3 className="text-lg font-bold text-foreground">Request sent</h3>
            <p className="text-sm text-muted-foreground">
              Thanks! We've emailed a confirmation to{" "}
              <span className="font-semibold text-foreground">{form.email}</span>.
              Our team will reach out within 1 business day.
            </p>
            <Button onClick={() => { onOpenChange(false); reset(); }} className="w-full mt-2">
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Request your order
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Tell us a bit about you and we'll follow up from{" "}
                <span className="font-semibold">info@bizzsurfer.com</span> within
                1 business day with pricing and next steps.
              </DialogDescription>
            </DialogHeader>

            {listings.length > 0 && (
              <div className="rounded-2xl border border-border bg-muted/40 p-3 mt-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                  {listings.length} item{listings.length === 1 ? "" : "s"} in your request
                </p>
                <ul className="space-y-1">
                  {listings.map((l) => (
                    <li key={l.id} className="text-xs text-foreground truncate">
                      • <span className="font-semibold">{l.title}</span>{" "}
                      <span className="text-muted-foreground">— {l.provider}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={submit} className="space-y-3 mt-3">
              <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="ord-hp">Leave this field empty</label>
                <input
                  id="ord-hp"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.honeypot}
                  onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ord-name">Name *</Label>
                  <Input
                    id="ord-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    maxLength={200}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ord-email">Email *</Label>
                  <Input
                    id="ord-email"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ord-company">Company</Label>
                  <Input
                    id="ord-company"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    maxLength={200}
                    autoComplete="organization"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ord-phone">Phone</Label>
                  <Input
                    id="ord-phone"
                    type="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    maxLength={60}
                    autoComplete="tel"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ord-message">Message (optional)</Label>
                <Textarea
                  id="ord-message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Anything we should know about your use case, timeline, or team?"
                  rows={3}
                  maxLength={2000}
                />
              </div>
              <Button
                type="submit"
                disabled={loading || listings.length === 0}
                className="w-full h-11 font-bold mt-1"
              >
                {loading ? "Sending…" : "Send request"}
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
