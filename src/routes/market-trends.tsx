import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Newspaper,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";
import marketTrendsCover from "@/assets/market-trends-card.png";

export const Route = createFileRoute("/market-trends")({
  head: () => ({
    meta: [
      { title: "Market Trends — Agentic AI News & Benchmarks | BizzSurfer" },
      {
        name: "description",
        content:
          "Search the latest Agentic AI news, market trends, and benchmarking studies. Save articles for later and follow what enterprise transformation leaders are reading.",
      },
      { property: "og:title", content: "Market Trends — Agentic AI News & Benchmarks" },
      {
        property: "og:description",
        content:
          "Curated Agentic AI market trends, research, and weekly news for transformation leaders.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://go.bizzsurfer.ai/market-trends" },
    ],
    links: [{ rel: "canonical", href: "https://go.bizzsurfer.ai/market-trends" }],
  }),
  component: MarketTrendsPage,
});

const CATEGORIES = [
  "All",
  "Research",
  "Analyst",
  "Operators",
  "Funding",
  "Regulation",
  "Tools",
] as const;
type Category = (typeof CATEGORIES)[number];

type NewsItem = {
  id: string;
  source: string;
  title: string;
  summary: string;
  href: string;
  date: string;
  category: Exclude<Category, "All">;
};

const REPORT_URL = "https://www.bizzsurfer.com/reports";
const PAGE_SIZE = 6;
const BOOKMARKS_KEY = "bizzsurfer:market-trends:bookmarks";

const NEWS: NewsItem[] = [
  {
    id: "gartner-2029",
    source: "Gartner",
    title: "Agentic AI predicted to autonomously resolve 80% of common service issues by 2029",
    summary:
      "Gartner forecasts a 30% reduction in operational costs across customer service operations driven by autonomous agents.",
    href: "https://www.gartner.com/en/newsroom/press-releases/2025-03-05-gartner-predicts-agentic-ai-will-autonomously-resolve-80-percent-of-common-customer-service-issues",
    date: "2025",
    category: "Analyst",
  },
  {
    id: "mck-state-of-ai",
    source: "McKinsey",
    title: "The state of AI: Agentic systems move from pilots to production",
    summary:
      "Enterprises shifting from copilots to autonomous agents are seeing measurable EBITDA impact in finance, supply chain, and CX.",
    href: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
    date: "2025",
    category: "Research",
  },
  {
    id: "mit-stall",
    source: "MIT Sloan",
    title: "Why most agentic AI projects stall — and what the leaders do differently",
    summary:
      "Successful programs invest in tool orchestration, evaluation harnesses, and human-in-the-loop guardrails from day one.",
    href: "https://sloanreview.mit.edu/topic/artificial-intelligence/",
    date: "2025",
    category: "Research",
  },
  {
    id: "a16z-agentic-stack",
    source: "a16z",
    title: "The agentic stack: from LLM apps to autonomous workflows",
    summary:
      "Andreessen Horowitz maps the emerging agentic infrastructure layer — orchestration, memory, tools, and evaluation.",
    href: "https://a16z.com/ai/",
    date: "2025",
    category: "Tools",
  },
  {
    id: "forrester-contract",
    source: "Forrester",
    title: "Agentic AI reshapes the enterprise software contract",
    summary:
      "Buyers are renegotiating SaaS deals to include outcome-based pricing as agents replace seat-based usage.",
    href: "https://www.forrester.com/blogs/category/artificial-intelligence-ai/",
    date: "2025",
    category: "Analyst",
  },
  {
    id: "bizzsurfer-insights",
    source: "BizzSurfer Insights",
    title: "How transformation leaders are operationalising Agentic AI",
    summary:
      "Playbooks, frameworks and benchmarks from operators shipping autonomous workflows in regulated enterprises.",
    href: "/insights",
    date: "Weekly",
    category: "Operators",
  },
  {
    id: "eu-ai-act",
    source: "European Commission",
    title: "EU AI Act: what agentic systems must disclose in 2026",
    summary:
      "New transparency, logging and human-oversight obligations enter force for high-risk autonomous agents.",
    href: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    date: "2026",
    category: "Regulation",
  },
  {
    id: "openai-agents-sdk",
    source: "OpenAI",
    title: "Agents SDK: long-running, tool-using workflows in production",
    summary:
      "OpenAI's agent framework adds persistent memory, structured tool calls and evaluation hooks for enterprise teams.",
    href: "https://platform.openai.com/docs/guides/agents",
    date: "2025",
    category: "Tools",
  },
  {
    id: "anthropic-mcp",
    source: "Anthropic",
    title: "Model Context Protocol becomes the de-facto agent integration layer",
    summary:
      "MCP adoption accelerates as vendors standardise how agents discover and call enterprise tools.",
    href: "https://www.anthropic.com/news/model-context-protocol",
    date: "2025",
    category: "Tools",
  },
  {
    id: "cbinsights-funding",
    source: "CB Insights",
    title: "Agentic AI startups raise record funding in Q1 2026",
    summary:
      "Vertical agent companies in finance, legal and healthcare lead the round, with median Series A above $30M.",
    href: "https://www.cbinsights.com/research/artificial-intelligence-top-startups/",
    date: "Q1 2026",
    category: "Funding",
  },
  {
    id: "bcg-roi",
    source: "BCG",
    title: "Where agentic AI actually pays back: a 200-company benchmark",
    summary:
      "Procurement, FP&A and tier-1 support deliver the fastest payback; sales agents take longer but lift conversion 18%.",
    href: "https://www.bcg.com/capabilities/artificial-intelligence",
    date: "2025",
    category: "Research",
  },
  {
    id: "operator-playbook",
    source: "BizzSurfer Operators",
    title: "Inside an autonomous finance close: 14 days → 3 days",
    summary:
      "How a mid-market CFO team rebuilt month-end with a network of specialised agents and a human reviewer.",
    href: "/insights",
    date: "Weekly",
    category: "Operators",
  },
];

function useBookmarks() {
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BOOKMARKS_KEY);
      if (raw) setIds(new Set(JSON.parse(raw) as string[]));
    } catch {
      // ignore
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(ids)));
    } catch {
      // ignore
    }
  }, [ids]);

  const toggle = (id: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        trackEvent("market_trends_bookmark_removed", { id });
      } else {
        next.add(id);
        trackEvent("market_trends_bookmark_added", { id });
      }
      return next;
    });
  };

  return { ids, toggle };
}

function MarketTrendsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { ids: bookmarks, toggle: toggleBookmark } = useBookmarks();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NEWS.filter((item) => {
      if (showSavedOnly && !bookmarks.has(item.id)) return false;
      if (category !== "All" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q)
      );
    });
  }, [query, category, showSavedOnly, bookmarks]);

  // Reset paging when filters change
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, category, showSavedOnly]);

  const visibleItems = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  // Infinite scroll
  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore) {
          setLoadingMore(true);
          // Simulated load delay so the skeleton has a chance to render
          window.setTimeout(() => {
            setVisible((v) => v + PAGE_SIZE);
            setLoadingMore(false);
            trackEvent("market_trends_load_more", { page_size: PAGE_SIZE });
          }, 350);
        }
      },
      { rootMargin: "240px 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, visible, filtered.length]);

  const trackOutbound = (item: NewsItem) =>
    trackEvent("market_trends_news_click", {
      source: item.source,
      title: item.title,
      url: item.href,
      category: item.category,
    });

  return (
    <div className="min-h-[60vh] px-5 py-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        <TrendingUp className="w-4 h-4" />
        Market Trends
      </div>
      <h1 className="mt-2 text-3xl font-bold text-foreground">
        Agentic AI — News & Benchmarks
      </h1>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
        The signal, not the noise. Curated market trends, research, and news for
        transformation leaders shipping Agentic AI in production.
      </p>

      {/* Featured report */}
      <section className="mt-6 overflow-hidden rounded-2xl border-2 border-[#02459c] bg-card shadow-card">
        <div className="grid sm:grid-cols-[200px_1fr]">
          <img
            src={marketTrendsCover}
            alt="Market Trends Report — Agentic AI benchmarking study"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#ff6f00]">
              <FileText className="w-4 h-4" />
              Featured report
            </div>
            <h2 className="mt-2 text-xl font-bold text-foreground">
              Market Trends Report 2025
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Download the latest Agentic AI benchmarking study — adoption, ROI,
              and the operating model behind enterprise wins.
            </p>
            <a
              href={REPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("market_trends_report_download", { url: REPORT_URL })
              }
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-agentic px-4 py-2 text-sm font-bold text-white shadow-soft transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              Download report
            </a>
          </div>
        </div>
      </section>

      {/* News feed */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Latest in Agentic AI</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Hand-picked from analysts, operators, and the BizzSurfer research desk.
        </p>

        {/* Search + filters */}
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="sr-only">Search news</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.length > 2) {
                    trackEvent("market_trends_search", { query: e.target.value });
                  }
                }}
                placeholder="Search by topic, source, or keyword…"
                className="pl-9 pr-9"
                aria-label="Search Agentic AI news"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </label>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <Filter className="w-4 h-4 shrink-0 text-muted-foreground" />
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategory(c);
                    trackEvent("market_trends_filter", { category: c });
                  }}
                  className={
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors " +
                    (active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground")
                  }
                  aria-pressed={active}
                >
                  {c}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setShowSavedOnly((s) => !s);
                trackEvent("market_trends_saved_toggle", { on: !showSavedOnly });
              }}
              aria-pressed={showSavedOnly}
              className={
                "ml-auto shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors " +
                (showSavedOnly
                  ? "bg-[#ff6f00] text-white shadow-soft"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground")
              }
              title={showSavedOnly ? "Showing saved articles" : "Show saved articles"}
            >
              {showSavedOnly ? (
                <BookmarkCheck className="w-3.5 h-3.5" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
              Saved {bookmarks.size > 0 ? `(${bookmarks.size})` : ""}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
            </span>
            {(query || category !== "All" || showSavedOnly) && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                  setShowSavedOnly(false);
                }}
                className="font-medium text-primary hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <Newspaper className="mx-auto w-8 h-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              No articles match your filters
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different keyword or clear the filters above.
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3">
            {visibleItems.map((item) => {
              const isInternal = item.href.startsWith("/");
              const saved = bookmarks.has(item.id);
              const inner = (
                <article className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#02459c] hover:shadow-elegant">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
                      <span>{item.source}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{item.date}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal text-muted-foreground">
                        {item.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleBookmark(item.id);
                      }}
                      aria-label={saved ? "Remove from saved" : "Save for later"}
                      aria-pressed={saved}
                      className={
                        "shrink-0 rounded-full p-1.5 transition-colors " +
                        (saved
                          ? "bg-[#ff6f00]/10 text-[#ff6f00] hover:bg-[#ff6f00]/20"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground")
                      }
                    >
                      {saved ? (
                        <BookmarkCheck className="w-4 h-4" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-foreground leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {item.summary}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                    Read more
                    {isInternal ? (
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5" />
                    )}
                  </span>
                </article>
              );
              return (
                <li key={item.id}>
                  {isInternal ? (
                    <Link
                      to={item.href}
                      onClick={() => trackOutbound(item)}
                      className="block"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackOutbound(item)}
                      className="block"
                    >
                      {inner}
                    </a>
                  )}
                </li>
              );
            })}

            {loadingMore &&
              Array.from({ length: 3 }).map((_, i) => (
                <li key={`skeleton-${i}`}>
                  <NewsSkeleton />
                </li>
              ))}
          </ul>
        )}

        {hasMore && (
          <>
            <div ref={sentinelRef} aria-hidden="true" className="h-1" />
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoadingMore(true);
                  window.setTimeout(() => {
                    setVisible((v) => v + PAGE_SIZE);
                    setLoadingMore(false);
                    trackEvent("market_trends_load_more", {
                      page_size: PAGE_SIZE,
                      trigger: "button",
                    });
                  }, 250);
                }}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          </>
        )}
        {!hasMore && filtered.length > PAGE_SIZE && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            You're all caught up — {filtered.length} articles shown.
          </p>
        )}
      </section>

      <section className="mt-10 rounded-2xl bg-gradient-primary p-6 text-primary-foreground shadow-elegant">
        <h2 className="text-lg font-bold">Want this in your inbox?</h2>
        <p className="mt-1 text-sm opacity-95">
          Get the BizzSurfer weekly digest — Agentic AI news, benchmarks and
          operator playbooks.
        </p>
        <Link
          to="/insights"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-white/90"
        >
          Explore insights <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}

function NewsSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-3 w-12 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
      <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-3 w-20 animate-pulse rounded bg-muted" />
    </div>
  );
}
