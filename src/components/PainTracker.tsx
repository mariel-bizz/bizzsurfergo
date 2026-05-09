import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, type LucideIcon } from "lucide-react";

export type PainItem = {
  key: string;
  icon: LucideIcon;
  title: string;
  desc: string;
};

type State = { active: boolean; intensity: number };

const SEVERITY = (n: number) =>
  n >= 8 ? "Critical" : n >= 6 ? "High" : n >= 4 ? "Moderate" : n > 0 ? "Low" : "—";

export function PainTracker({ items }: { items: PainItem[] }) {
  const [state, setState] = useState<Record<string, State>>(() =>
    Object.fromEntries(items.map((p) => [p.key, { active: true, intensity: 5 }]))
  );

  const ranked = useMemo(() => {
    return items
      .map((p) => ({ ...p, ...state[p.key] }))
      .filter((p) => p.active && p.intensity > 0)
      .sort((a, b) => b.intensity - a.intensity);
  }, [items, state]);

  const top = ranked[0];
  const totalScore = ranked.reduce((s, p) => s + p.intensity, 0);

  const promptText = useMemo(() => {
    if (ranked.length === 0)
      return "Help me diagnose where to start with Agentic AI for enterprise transformation.";
    const lines = ranked
      .slice(0, 3)
      .map((p, i) => `${i + 1}. ${p.title} — severity ${p.intensity}/10 (${SEVERITY(p.intensity)})`)
      .join("\n");
    return `As a transformation leader, my top pain points right now are:\n${lines}\n\nWhat should I tackle first, and how can Agentic AI help me move the needle in the next 90 days?`;
  }, [ranked]);

  return (
    <div className="space-y-3">
      {/* Top pain banner */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-500 ${
          top
            ? "bg-gradient-primary text-primary-foreground border-transparent shadow-elegant"
            : "bg-muted/40 text-muted-foreground border-border"
        }`}
        aria-live="polite"
      >
        {top && (
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/15 blur-2xl animate-pulse" />
        )}
        <div className="relative flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              top ? "bg-white/20 backdrop-blur" : "bg-background"
            }`}
          >
            <Flame className={`w-5 h-5 ${top ? "animate-pulse" : ""}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
              {top ? "Your top pain" : "Toggle pains to begin"}
            </p>
            <p className="text-sm font-bold truncate">
              {top ? top.title : "Select what hurts most"}
            </p>
          </div>
          {top && (
            <div className="text-right">
              <p className="text-2xl font-black leading-none">{top.intensity}</p>
              <p className="text-[10px] uppercase opacity-80">/10</p>
            </div>
          )}
        </div>
      </div>

      {/* Pain items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((p, i) => {
          const s = state[p.key];
          const isTop = top?.key === p.key;
          const rank = ranked.findIndex((r) => r.key === p.key);
          return (
            <div
              key={p.key}
              className={`group relative rounded-2xl border p-4 transition-all duration-300 overflow-hidden ${
                s.active
                  ? "bg-card shadow-card hover:shadow-elegant"
                  : "bg-muted/30 border-dashed opacity-70"
              } ${isTop ? "border-primary ring-2 ring-primary/30 -translate-y-0.5" : "border-border"}`}
            >
              {isTop && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary animate-pulse" />
              )}
              {s.active && rank >= 0 && (
                <div className="absolute right-3 top-3 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  #{rank + 1}
                </div>
              )}
              <div className="flex items-start gap-3">
                <div
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 ${
                    s.active
                      ? "bg-gradient-primary shadow-soft group-hover:scale-110"
                      : "bg-muted"
                  }`}
                >
                  <p.icon
                    className={`w-5 h-5 ${s.active ? "text-primary-foreground" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-foreground leading-snug pr-8">
                      {p.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <Switch
                  checked={s.active}
                  onCheckedChange={(v) =>
                    setState((prev) => ({ ...prev, [p.key]: { ...prev[p.key], active: v } }))
                  }
                  aria-label={`Toggle ${p.title}`}
                />
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    s.active && s.intensity >= 8
                      ? "text-destructive"
                      : s.active && s.intensity >= 6
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.active ? `${SEVERITY(s.intensity)} · ${s.intensity}/10` : "Off"}
                </span>
              </div>

              <Slider
                className="mt-2"
                value={[s.intensity]}
                min={0}
                max={10}
                step={1}
                disabled={!s.active}
                onValueChange={(v) =>
                  setState((prev) => ({ ...prev, [p.key]: { ...prev[p.key], intensity: v[0] } }))
                }
                aria-label={`Intensity for ${p.title}`}
              />
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Pain index
            </p>
            <p className="text-sm font-bold text-foreground">
              {totalScore} pts · {ranked.length} active
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95"
          >
            <Link to="/chat" search={{ q: promptText }}>
              Get a plan <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
