import { useEffect, useRef, useState } from "react";
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
import { useServerFn } from "@tanstack/react-start";
import { subscribeNewsletter } from "@/lib/newsletter.functions";
import { toast } from "sonner";
import { Mail, CheckCircle2, Sparkles } from "lucide-react";

const STORAGE_KEY = "bizzsurfer_newsletter_popup";
const DELAY_MS = 20_000; // show after 20s on the page
const SUPPRESS_DAYS = 30; // don't reopen for 30 days after close/subscribe

type Suppression = { until: number; subscribed?: boolean };

function readSuppression(): Suppression | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Suppression;
  } catch {
    return null;
  }
}

function writeSuppression(s: Suppression) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function NewsletterDialog() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const renderedAt = useRef<number>(0);
  const subscribe = useServerFn(subscribeNewsletter);

  // Avoid SSR hydration mismatch — only decide on client.
  useEffect(() => {
    setMounted(true);
    const sup = readSuppression();
    if (sup && sup.until > Date.now()) return;
    const t = window.setTimeout(() => {
      renderedAt.current = Date.now();
      setOpen(true);
    }, DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v && !done) {
      writeSuppression({ until: Date.now() + SUPPRESS_DAYS * 86_400_000 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await subscribe({
        data: {
          email,
          name: name || null,
          website: website || null,
          elapsedMs: Date.now() - renderedAt.current,
        },
      });
      setDone(true);
      writeSuppression({
        until: Date.now() + 365 * 86_400_000,
        subscribed: true,
      });
      toast.success("You're subscribed! Check your inbox soon.");
      window.setTimeout(() => {
        setOpen(false);
      }, 1800);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't subscribe right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-primary mx-auto mb-2 shadow-soft">
            <Mail className="w-6 h-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-xl">
            Join the BizzSurfer newsletter
          </DialogTitle>
          <DialogDescription className="text-center">
            Weekly drops: AI tools, indie playbooks and early access to new
            features. No spam — unsubscribe anytime.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <CheckCircle2 className="w-10 h-10 text-primary" />
            <p className="text-sm text-muted-foreground text-center">
              You're on the list. Welcome aboard!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Honeypot — hidden from real users */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-10000px",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            >
              <label htmlFor="nl-website">Website</label>
              <input
                id="nl-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nl-name">First name (optional)</Label>
              <Input
                id="nl-name"
                placeholder="Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nl-email">Email</Label>
              <Input
                id="nl-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                maxLength={254}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              {loading ? "Subscribing…" : "Subscribe"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center leading-tight">
              By subscribing you agree to receive emails from BizzSurfer. We
              never share your address.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
