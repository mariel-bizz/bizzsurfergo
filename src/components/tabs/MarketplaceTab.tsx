import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Bot, Briefcase, FileText, Sparkles, Star, Search } from "lucide-react";
import { listings, categoryMeta, type Category } from "@/lib/marketplace-data";

const categories: { key: Category | "all"; label: string; icon: typeof Bot }[] = [
  { key: "all", label: "All", icon: Sparkles },
  { key: "agents", label: "Agents", icon: Bot },
  { key: "services", label: "Services", icon: Briefcase },
  { key: "templates", label: "Templates", icon: FileText },
];

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

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">
          No listings match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filtered.map((l) => {
            const meta = categoryMeta[l.category];
            const Icon = meta.icon;
            return (
              <Link
                key={l.id}
                to="/marketplace/$listingId"
                params={{ listingId: l.id }}
                className="group h-full flex flex-col rounded-3xl bg-card border border-border shadow-card p-4 transition hover:border-primary/40 hover:shadow-soft hover:-translate-y-0.5"
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
                    <p className="text-xs text-muted-foreground truncate">by {l.provider}</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-foreground/90 line-clamp-3">{l.tagline}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {l.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between gap-3 border-t border-border/60 mt-4">
                  <span className="text-sm font-bold text-foreground">{l.price}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-soft transition group-hover:shadow-elegant">
                    View details
                    <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

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
