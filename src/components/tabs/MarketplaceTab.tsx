import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Briefcase,
  FileText,
  Sparkles,
  Star,
  Download,
  ArrowRight,
  Search,
} from "lucide-react";

type Category = "agents" | "services" | "templates";

type Listing = {
  id: string;
  category: Category;
  title: string;
  provider: string;
  tagline: string;
  tags: string[];
  price: string;
  rating: number;
  cta: string;
};

const listings: Listing[] = [
  // Agents
  {
    id: "agent-board-brief",
    category: "agents",
    title: "Board Brief Composer",
    provider: "BizzSurfer Labs",
    tagline: "Turns weekly metrics into a one-page board narrative in seconds.",
    tags: ["Reporting", "C-Suite"],
    price: "Included with Hero",
    rating: 4.9,
    cta: "Install Agent",
  },
  {
    id: "agent-deal-radar",
    category: "agents",
    title: "Deal Radar",
    provider: "Northwind AI",
    tagline: "Monitors pipeline signals and flags deals at risk every morning.",
    tags: ["Sales", "Revenue Ops"],
    price: "€39 / mo",
    rating: 4.7,
    cta: "Install Agent",
  },
  {
    id: "agent-policy-scout",
    category: "agents",
    title: "Policy Scout",
    provider: "Veritas Cognitive",
    tagline: "Tracks EU AI Act updates and maps them to your compliance posture.",
    tags: ["Compliance", "Risk"],
    price: "€59 / mo",
    rating: 4.8,
    cta: "Install Agent",
  },
  // Services
  {
    id: "svc-transformation-sprint",
    category: "services",
    title: "AI Transformation Sprint",
    provider: "Helix Advisory",
    tagline: "6-week diagnostic + roadmap with executive workshops and KPIs.",
    tags: ["Strategy", "Roadmap"],
    price: "From €18,000",
    rating: 4.9,
    cta: "Request Intro",
  },
  {
    id: "svc-agentops",
    category: "services",
    title: "AgentOps Implementation",
    provider: "Mosaic Partners",
    tagline: "Stand up production-grade agent infrastructure on your stack.",
    tags: ["Engineering", "MLOps"],
    price: "Custom",
    rating: 4.8,
    cta: "Request Intro",
  },
  {
    id: "svc-governance",
    category: "services",
    title: "AI Governance Audit",
    provider: "Beacon & Co.",
    tagline: "Independent audit of model risk, data lineage, and policy gaps.",
    tags: ["Governance", "Audit"],
    price: "From €9,500",
    rating: 4.7,
    cta: "Request Intro",
  },
  // Templates
  {
    id: "tpl-roi-model",
    category: "templates",
    title: "Executive ROI Model",
    provider: "BizzSurfer Studio",
    tagline: "Editable financial model for AI initiatives with sensitivity analysis.",
    tags: ["Finance", "ROI"],
    price: "Free",
    rating: 4.9,
    cta: "Download",
  },
  {
    id: "tpl-prompt-pack",
    category: "templates",
    title: "C-Suite Prompt Pack",
    provider: "Prompt Atelier",
    tagline: "120 battle-tested prompts for strategy, finance, and operations.",
    tags: ["Prompts", "Productivity"],
    price: "€29",
    rating: 4.8,
    cta: "Download",
  },
  {
    id: "tpl-playbook",
    category: "templates",
    title: "Agentic Transformation Playbook",
    provider: "BizzSurfer Studio",
    tagline: "90-day playbook with rituals, scorecards, and stakeholder maps.",
    tags: ["Playbook", "Change"],
    price: "€49",
    rating: 4.9,
    cta: "Download",
  },
];

const categories: {
  key: Category | "all";
  label: string;
  icon: typeof Bot;
}[] = [
  { key: "all", label: "All", icon: Sparkles },
  { key: "agents", label: "Agents", icon: Bot },
  { key: "services", label: "Services", icon: Briefcase },
  { key: "templates", label: "Templates", icon: FileText },
];

const categoryMeta: Record<Category, { label: string; icon: typeof Bot }> = {
  agents: { label: "Agent", icon: Bot },
  services: { label: "Service", icon: Briefcase },
  templates: { label: "Template", icon: FileText },
};

export function MarketplaceTab() {
  const [active, setActive] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = listings.filter((l) => {
    const matchesCat = active === "all" || l.category === active;
    const q = query.trim().toLowerCase();
    const matchesQ =
      !q ||
      l.title.toLowerCase().includes(q) ||
      l.provider.toLowerCase().includes(q) ||
      l.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCat && matchesQ;
  });

  return (
    <div className="px-5 py-5 space-y-5">
      <header className="text-center">
        <span className="inline-block rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
          Marketplace
        </span>
        <h1 className="mt-3 text-2xl font-bold text-foreground">
          Curated agents, services & playbooks
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hand-picked tools to accelerate your Agentic AI transformation.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search marketplace..."
          className="w-full h-11 rounded-2xl bg-card border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label="Search marketplace"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
        {categories.map((c) => {
          const isActive = active === c.key;
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 h-9 text-xs font-bold transition border ${
                isActive
                  ? "bg-gradient-primary text-primary-foreground border-transparent shadow-soft"
                  : "bg-card text-foreground border-border"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">
            No listings match your search.
          </p>
        )}
        {filtered.map((l) => {
          const meta = categoryMeta[l.category];
          const Icon = meta.icon;
          const isFree = l.price.toLowerCase() === "free";
          return (
            <article
              key={l.id}
              className="rounded-3xl bg-card border border-border shadow-card p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      {meta.label}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-muted-foreground">
                      <Star className="w-3 h-3 fill-current text-amber-500" />
                      {l.rating.toFixed(1)}
                    </span>
                  </div>
                  <h2 className="mt-0.5 text-base font-bold text-foreground truncate">
                    {l.title}
                  </h2>
                  <p className="text-xs text-muted-foreground">by {l.provider}</p>
                </div>
              </div>

              <p className="mt-3 text-sm text-foreground/90">{l.tagline}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {l.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-foreground">{l.price}</span>
                <Button
                  size="sm"
                  className="h-9 px-4 bg-gradient-primary text-primary-foreground font-bold"
                >
                  {l.category === "templates" && !isFree ? (
                    <Download className="w-4 h-4 mr-1.5" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-1.5" />
                  )}
                  {l.cta}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="rounded-3xl bg-gradient-deep p-5 text-primary-foreground shadow-elegant">
        <p className="text-xs font-bold uppercase tracking-widest text-white/80">
          List your offering
        </p>
        <h3 className="mt-2 text-lg font-bold text-white">
          Reach transformation leaders
        </h3>
        <p className="mt-1 text-sm text-white/85">
          Submit your agent, service, or playbook for review by the BizzSurfer team.
        </p>
        <Button className="mt-4 w-full h-11 bg-white text-primary hover:bg-white/90 font-bold">
          Apply to be listed
        </Button>
      </div>
    </div>
  );
}
