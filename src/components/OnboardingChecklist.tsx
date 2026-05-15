import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bot,
  Flame,
  Store,
  CalendarDays,
  UserCircle2,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useGame, type OnboardingStep } from "./AppShell";
import { Button } from "@/components/ui/button";

type Item = {
  key: OnboardingStep;
  icon: LucideIcon;
  title: string;
  desc: string;
  cta: string;
  to: string;
};

const ITEMS: Item[] = [
  {
    key: "chat",
    icon: Bot,
    title: "Chat with BizzSurfer GO!",
    desc: "Ask questions to BizzSurfer Go! using Perplexity, Mistral AI, OpenAI, Claude Anthropic and Gemini!",
    cta: "Time to chat",
    to: "/chat",
  },
  {
    key: "reality",
    icon: Flame,
    title: "Run the Reality Check",
    desc: "60 seconds to score your top transformation pains.",
    cta: "PAIN POINT >",
    to: "#reality-check",
  },
  {
    key: "marketplace",
    icon: Store,
    title: "Explore Agentic AI tools!",
    desc: "Browse our offers to boost your transformation!",
    cta: "GO AGENTIC >",
    to: "/marketplace",
  },
  {
    key: "events",
    icon: CalendarDays,
    title: "Grab Your Seat for the next events!",
    desc: "RSVP or add one event to your calendar!",
    cta: "EVENTS >",
    to: "/events",
  },
  {
    key: "profile",
    icon: UserCircle2,
    title: "Complete Your Profile",
    desc: "Name, role and company unlock personalised picks!",
    cta: "PROFILE >",
    to: "/profile",
  },
];

export function OnboardingChecklist() {
  const game = useGame();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const { onboarding } = game.state;
  if (onboarding.dismissed) return null;
  const done = ITEMS.filter((i) => onboarding.steps[i.key]).length;
  const total = ITEMS.length;
  const allDone = done === total;
  if (allDone && onboarding.completedAt) {
    // hide permanently once user has completed and we've shown the celebration
    const completed = new Date(onboarding.completedAt).getTime();
    if (Date.now() - completed > 1000 * 60 * 60 * 24) return null;
  }

  const pct = Math.round((done / total) * 100);

  const handleClick = (item: Item) => {
    if (item.to.startsWith("#")) {
      const el = typeof document !== "undefined" ? document.getElementById(item.to.slice(1)) : null;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    navigate({ to: item.to as "/chat" });
  };

  return (
    <section className="px-5">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {/* gradient halo */}
        <span className="pointer-events-none absolute -inset-12 bg-[radial-gradient(circle_at_20%_0%,hsl(var(--primary)/0.15),transparent_60%)] blur-2xl" />

        {/* Header */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative w-full flex items-center gap-3 p-4 text-left"
          aria-expanded={open}
        >
          {/* Progress ring */}
          <div className="relative w-12 h-12 shrink-0">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                strokeWidth="3"
                className="stroke-muted"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${pct}, 100`}
                className="stroke-primary transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {allDone ? (
                <Check className="w-5 h-5 text-primary" />
              ) : (
                <span className="text-[11px] font-extrabold text-foreground">{done}/{total}</span>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-soft">
                <Sparkles className="w-3 h-3" />
                Get started
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">+25 XP per step</span>
            </div>
            <p className="text-sm text-primary font-bold mt-1 leading-snug">
              {allDone ? "You're all set — Launch Crew unlocked!" : `${done} of ${total} done — Let's get started!`}
            </p>
          </div>

          <span className="shrink-0 text-muted-foreground">
            {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </button>

        {open && (
          <div className="relative px-3 pb-3 space-y-2">
            <ul className="space-y-2">
              {ITEMS.map((item) => {
                const isDone = onboarding.steps[item.key];
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => handleClick(item)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                        isDone
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-background hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                          isDone ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                        aria-hidden
                      >
                        {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold leading-tight ${
                            isDone ? "text-muted-foreground line-through" : "text-foreground"
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 font-semibold">
                          {item.desc}
                        </p>
                      </div>
                      {!isDone && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary shrink-0">
                          {item.cta}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-end pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => game.dismissOnboarding()}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Hide checklist
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
