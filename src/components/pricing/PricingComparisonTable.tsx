import { Check, Minus } from "lucide-react";

type TierKey = "go" | "hero" | "champion" | "team";

interface Row {
  label: string;
  values: Record<TierKey, boolean | string>;
}

const ROWS: Row[] = [
  { label: "BizzSurfer Go! AI Chat", values: { go: "8 / month", hero: "Unlimited", champion: "Unlimited", team: "Unlimited" } },
  { label: "Pain Points Assessment", values: { go: true, hero: true, champion: true, team: true } },
  { label: "FAQ Library", values: { go: true, hero: true, champion: true, team: true } },
  { label: "Event Registrations", values: { go: "2 / month", hero: "Unlimited", champion: "Unlimited", team: "Unlimited" } },
  { label: "ROI Calculator", values: { go: "Basic", hero: "Advanced", champion: "Advanced", team: "Advanced" } },
  { label: "Research Reports Library", values: { go: false, hero: true, champion: true, team: true } },
  { label: "Priority AI Response", values: { go: false, hero: true, champion: true, team: true } },
  { label: "Monthly Market Trends Reports", values: { go: false, hero: true, champion: true, team: true } },
  { label: "Custom Agentic AI Agents", values: { go: false, hero: false, champion: true, team: true } },
  { label: "Enterprise API & Integrations", values: { go: false, hero: false, champion: true, team: true } },
  { label: "Premium AI (Claude, Gemini, OpenAI, Mistral, Perplexity)", values: { go: false, hero: false, champion: false, team: true } },
  { label: "Team management", values: { go: false, hero: false, champion: false, team: true } },
  { label: "Dedicated Success Manager", values: { go: false, hero: false, champion: true, team: true } },
];

const HEADERS: { key: TierKey; label: string }[] = [
  { key: "go", label: "Go" },
  { key: "hero", label: "Hero" },
  { key: "champion", label: "Champion" },
  { key: "team", label: "Team" },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-4 h-4 text-primary mx-auto" />;
  if (value === false) return <Minus className="w-4 h-4 text-muted-foreground/50 mx-auto" />;
  return <span className="text-xs text-foreground">{value}</span>;
}

export function PricingComparisonTable() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-bold text-foreground">Compare plans</h3>
        <p className="text-xs text-muted-foreground">Everything included in Go, Hero, Champion, and Team.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="text-left px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Feature</th>
              {HEADERS.map((h) => (
                <th key={h.key} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground text-center min-w-[72px]">
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, idx) => (
              <tr key={row.label} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                <td className="px-3 py-2.5 text-xs text-foreground">{row.label}</td>
                {HEADERS.map((h) => (
                  <td key={h.key} className="px-3 py-2.5 text-center">
                    <Cell value={row.values[h.key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
