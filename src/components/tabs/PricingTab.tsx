import { Button } from "@/components/ui/button";
import { Check, Crown, Rocket, Sparkles } from "lucide-react";
import { useState } from "react";

const tiers = [
  {
    id: "explorer",
    name: "Explorer",
    icon: Sparkles,
    monthly: 0, yearly: 0,
    tagline: "For curious leaders",
    features: [
      "BizzSurfer Go! chat — 20 questions / month",
      "Access to executive FAQs & frameworks",
      "Public events & masterclasses",
      "Daily XP & streak gamification",
    ],
    cta: "Upgrade to Explorer",
    highlighted: false,
  },
  {
    id: "leader",
    name: "Leader",
    icon: Rocket,
    monthly: 49, yearly: 490,
    tagline: "For Directors & VPs driving change",
    features: [
      "Unlimited BizzSurfer Go! conversations",
      "Personalised transformation playbooks",
      "Private CHRO / COO roundtable invites",
      "Save & export executive briefings",
      "Priority Agentic AI early access",
    ],
    cta: "Upgrade to Leader",
    highlighted: true,
    badge: "Most chosen",
  },
  {
    id: "boardroom",
    name: "Boardroom",
    icon: Crown,
    monthly: 199, yearly: 1990,
    tagline: "For C-Suite, boards & enterprise teams",
    features: [
      "Everything in Leader, for up to 10 seats",
      "Connect your enterprise systems (SSO)",
      "Dedicated transformation strategist",
      "Custom Agentic AI workflows pilot",
      "Quarterly board-ready insight reports",
    ],
    cta: "Upgrade to Boardroom",
    highlighted: false,
  },
];

export function PricingTab() {
  const [yearly, setYearly] = useState(true);

  return (
    <div className="px-5 py-5 space-y-5">
      <div className="text-center">
        <span className="inline-block rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">Upgrade</span>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Upgrade BizzSurfer Go! for transformation leaders</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose the upgrade that matches the scale of your ambition.</p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <span className={`text-xs font-semibold ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
        <button onClick={() => setYearly(!yearly)} className={`relative w-12 h-6 rounded-full transition ${yearly ? "bg-primary" : "bg-muted"}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${yearly ? "translate-x-6" : ""}`} />
        </button>
        <span className={`text-xs font-semibold ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
          Yearly <span className="text-primary">−2 mo free</span>
        </span>
      </div>

      <div className="space-y-4">
        {tiers.map((t) => (
          <div key={t.id} className={`relative rounded-3xl p-5 border transition ${
            t.highlighted
              ? "bg-gradient-deep text-primary-foreground border-primary shadow-elegant"
              : "bg-card border-border shadow-card"
          }`}>
            {t.badge && (
              <span className="absolute -top-2.5 right-5 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-soft">
                {t.badge}
              </span>
            )}
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${t.highlighted ? "bg-white/20 backdrop-blur" : "bg-gradient-primary"}`}>
                <t.icon className={`w-5 h-5 ${t.highlighted ? "text-white" : "text-primary-foreground"}`} />
              </div>
              <div>
                <p className={`text-base font-bold ${t.highlighted ? "text-white" : "text-foreground"}`}>{t.name}</p>
                <p className={`text-xs ${t.highlighted ? "text-white/80" : "text-muted-foreground"}`}>{t.tagline}</p>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className={`text-4xl font-bold ${t.highlighted ? "text-white" : "text-foreground"}`}>
                €{yearly ? Math.round(t.yearly / 12) : t.monthly}
              </span>
              <span className={`text-xs ${t.highlighted ? "text-white/80" : "text-muted-foreground"}`}>
                /mo {yearly && t.yearly > 0 && "billed yearly"}
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm">
                  <Check className={`w-4 h-4 mt-0.5 shrink-0 ${t.highlighted ? "text-white" : "text-primary"}`} />
                  <span className={t.highlighted ? "text-white/95" : "text-foreground"}>{f}</span>
                </li>
              ))}
            </ul>
            <Button className={`mt-5 w-full h-11 font-bold ${
              t.highlighted ? "bg-white text-primary hover:bg-white/90" : "bg-gradient-primary text-primary-foreground"
            }`}>
              {t.cta}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
