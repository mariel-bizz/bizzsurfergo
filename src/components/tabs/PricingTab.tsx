import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Crown, Rocket, Sparkles, Users, X, Loader2, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";

const HERO_MONTHLY = 14.99;
const HERO_YEARLY = 149;
const TEAM_SEAT_MONTHLY = +(HERO_MONTHLY * 0.9).toFixed(2); // 13.49
const TEAM_SEAT_YEARLY = +(HERO_YEARLY * 0.9).toFixed(2); // 134.10

const tiers = [
  {
    id: "go",
    name: "BizzSurfer Go!",
    icon: Sparkles,
    monthly: 0,
    yearly: 0,
    priceLabel: "Free",
    priceSuffix: "Forever",
    tagline: "Perfect for executives starting their AI intelligence journey.",
    features: [
      { label: "BizzSurfer Go! AI Chat (10 sessions/month)", included: true },
      { label: "Pain Points Assessment", included: true },
      { label: "FAQ Library Access", included: true },
      { label: "2 Event Registrations / month", included: true },
      { label: "Basic ROI Calculator", included: true },
      { label: "BizzSurfer Community Access", included: true },
      { label: "Unlimited AI Sessions", included: false },
      { label: "Premium Research Reports", included: false },
      { label: "Priority AI Response", included: false },
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    id: "hero",
    name: "BizzSurfer Go! Hero",
    icon: Rocket,
    monthly: 14.99,
    yearly: 149,
    priceLabel: "€14.99",
    priceSuffix: "per month",
    tagline: "For transformation leaders who need depth, speed, and strategic edge.",
    features: [
      { label: "Unlimited BizzSurfer AI Chat", included: true },
      { label: "Advanced ROI Calculator & Benchmarking", included: true },
      { label: "Full Research Reports Library", included: true },
      { label: "Unlimited Event Access", included: true },
      { label: "Priority AI Response", included: true },
      { label: "LinkedIn & Partner Ecosystem Access", included: true },
      { label: "Podcast & Content Library", included: true },
      { label: "Monthly Market Trends Reports", included: true },
      { label: "Dedicated Success Manager", included: false },
    ],
    cta: "Upgrade to Hero",
    highlighted: true,
    badge: "Most popular",
  },
  {
    id: "champion",
    name: "BizzSurfer Go! Champion",
    icon: Crown,
    monthly: 24.99,
    yearly: 249,
    priceLabel: "€24.99",
    priceSuffix: "per month",
    tagline: "Full-suite Agentic AI experience for senior transformation champions.",
    features: [
      { label: "Everything in Hero", included: true },
      { label: "Custom Agentic AI Agents", included: true },
      { label: "Enterprise API & Tool Integrations", included: true },
      { label: "Dedicated AI Transformation Advisor", included: true },
      { label: "Custom Benchmarking Dashboards", included: true },
      { label: "Board-Level Reporting Modules", included: true },
      { label: "SLA & Security Review", included: true },
      { label: "White-glove Onboarding", included: true },
    ],
    cta: "Become a Champion",
    highlighted: false,
  },
];

export function PricingTab() {
  const [yearly, setYearly] = useState(false);
  const [seats, setSeats] = useState(2);
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const { tier: currentTier, isActive } = useSubscription(user?.id ?? null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubscribe = (tierId: string) => {
    if (tierId === "go") return;
    if (!user) {
      window.location.href = "/login?redirect=/pricing";
      return;
    }
    const priceId = `${tierId}_${yearly ? "yearly" : "monthly"}`;
    openCheckout({
      priceId,
      quantity: tierId === "team" ? seats : 1,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  const teamSeatPrice = yearly ? TEAM_SEAT_YEARLY : TEAM_SEAT_MONTHLY;
  const teamTotal = (teamSeatPrice * seats).toFixed(2);

  return (
    <div className="px-5 py-5 space-y-5">
      <PaymentTestModeBanner />
      <div className="text-center">
        <span className="inline-block rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
          Pricing
        </span>
        <h1 className="mt-3 text-2xl font-bold text-foreground">
          AI intelligence for every stage of your transformation journey
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose the plan that matches the scale of your ambition.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <span className={`text-xs font-semibold ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
          Monthly
        </span>
        <button
          onClick={() => setYearly(!yearly)}
          className={`relative w-12 h-6 rounded-full transition ${yearly ? "bg-primary" : "bg-muted"}`}
          aria-label="Toggle yearly pricing"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${yearly ? "translate-x-6" : ""}`}
          />
        </button>
        <span className={`text-xs font-semibold ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
          Yearly <span className="text-primary">−2 mo free</span>
        </span>
      </div>

      <div className="space-y-4">
        {tiers.map((t) => {
          const isFree = t.monthly === 0;
          const displayPrice = isFree
            ? t.priceLabel
            : yearly
              ? `€${(t.yearly / 12).toFixed(2)}`
              : t.priceLabel;
          const displaySuffix = isFree
            ? t.priceSuffix
            : yearly
              ? `/mo billed yearly (€${t.yearly})`
              : t.priceSuffix;

          return (
            <div
              key={t.id}
              className={`relative rounded-3xl p-5 border transition ${
                t.highlighted
                  ? "bg-gradient-deep text-primary-foreground border-primary shadow-elegant"
                  : "bg-card border-border shadow-card"
              }`}
            >
              {t.badge && (
                <span className="absolute -top-2.5 right-5 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-soft">
                  {t.badge}
                </span>
              )}
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    t.highlighted ? "bg-white/20 backdrop-blur" : "bg-gradient-primary"
                  }`}
                >
                  <t.icon className={`w-5 h-5 ${t.highlighted ? "text-white" : "text-primary-foreground"}`} />
                </div>
                <div>
                  <p className={`text-base font-bold ${t.highlighted ? "text-white" : "text-foreground"}`}>
                    {t.name}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${t.highlighted ? "text-white" : "text-foreground"}`}>
                  {displayPrice}
                </span>
                <span className={`text-xs ${t.highlighted ? "text-white/80" : "text-muted-foreground"}`}>
                  {displaySuffix}
                </span>
              </div>

              <p className={`mt-3 text-sm ${t.highlighted ? "text-white/85" : "text-muted-foreground"}`}>
                {t.tagline}
              </p>

              <ul className="mt-4 space-y-2">
                {t.features.map((f) => (
                  <li key={f.label} className="flex gap-2 text-sm">
                    {f.included ? (
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${t.highlighted ? "text-white" : "text-primary"}`}
                      />
                    ) : (
                      <X
                        className={`w-4 h-4 mt-0.5 shrink-0 ${t.highlighted ? "text-white/50" : "text-muted-foreground"}`}
                      />
                    )}
                    <span
                      className={
                        f.included
                          ? t.highlighted
                            ? "text-white/95"
                            : "text-foreground"
                          : t.highlighted
                            ? "text-white/60"
                            : "text-muted-foreground"
                      }
                    >
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {(() => {
                const isCurrent = isActive && currentTier === t.id;
                return (
                  <Button
                    onClick={() => handleSubscribe(t.id)}
                    disabled={isCurrent || t.id === "go"}
                    className={`mt-5 w-full h-11 font-bold ${
                      t.highlighted
                        ? "bg-white text-primary hover:bg-white/90"
                        : "bg-gradient-primary text-primary-foreground"
                    }`}
                  >
                    {isCurrent ? "Current plan" : t.cta}
                  </Button>
                );
              })()}
            </div>
          );
        })}

        {/* Team plan — per-seat, no fixed cost */}
        <div className="relative rounded-3xl p-5 border bg-card border-border shadow-card">
          <span className="absolute -top-2.5 right-5 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-foreground shadow-soft">
            For teams
          </span>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-primary">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">BizzSurfer Team</p>
              <p className="text-xs text-muted-foreground">10% off Hero per seat · min 2 seats</p>
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">€{teamSeatPrice.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">
              per seat / {yearly ? "year" : "month"}
            </span>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            Everything in Hero for every seat, plus team management and Premium AI integrations
            (Claude, Gemini, OpenAI, Mistral, Perplexity).
          </p>

          <div className="mt-4 space-y-2">
            <Label htmlFor="team-seats" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Number of seats
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => setSeats((s) => Math.max(2, s - 1))}
                aria-label="Decrease seats"
                disabled={seats <= 2}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                id="team-seats"
                type="number"
                min={2}
                max={100}
                value={seats}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (Number.isFinite(n)) setSeats(Math.min(100, Math.max(2, n)));
                }}
                className="text-center h-10"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => setSeats((s) => Math.min(100, s + 1))}
                aria-label="Increase seats"
                disabled={seats >= 100}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-foreground">
              Total: <span className="font-bold">€{teamTotal}</span>{" "}
              <span className="text-muted-foreground">/ {yearly ? "year" : "month"}</span>
            </p>
          </div>

          <Button
            onClick={() => handleSubscribe("team")}
            className="mt-5 w-full h-11 font-bold bg-gradient-primary text-primary-foreground"
          >
            Get {seats} seats
          </Button>
        </div>
      </div>

      {isActive && (
        <p className="text-center text-xs text-muted-foreground">
          Manage your subscription on your <Link to="/profile" className="underline">Profile</Link>.
        </p>
      )}

      <Dialog open={isOpen} onOpenChange={(o) => { if (!o) closeCheckout(); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle>Complete your subscription</DialogTitle>
          </DialogHeader>
          <div className="p-2 min-h-[500px]">
            {checkoutElement ?? (
              <div className="flex items-center justify-center h-[500px]">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
