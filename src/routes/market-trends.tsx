import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Loader2,
  Mail,
  Newspaper,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import marketTrendsBanner from "@/assets/market-trends-banner.png";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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
  image: string;
};

const PAGE_SIZE = 6;
const BOOKMARKS_KEY = "bizzsurfer:market-trends:bookmarks";

const NEWS: NewsItem[] = [
  {
    id: "servicenow-ai-specialists",
    source: "ServiceNow",
    title: "AI agents and AI specialists: the new digital workforce",
    summary:
      "How enterprises are pairing AI agents with AI specialists to automate workflows and accelerate transformation.",
    href: "https://www.servicenow.com/workflow/ai/ai-agents-ai-specialists.html",
    date: "2026",
    category: "Operators",
    image: "https://logo.clearbit.com/servicenow.com",
  },
  {
    id: "microsoft-wti-2026",
    source: "Microsoft WorkLab",
    title: "Agents, human agency and the opportunity for every organization",
    summary:
      "Microsoft's 2026 Work Trend Index on how agentic AI is reshaping every role and every organization.",
    href: "https://www.microsoft.com/en-us/worklab/work-trend-index/agents-human-agency-and-the-opportunity-for-every-organization#wti2026-modular-worklab-rtitle-d1e901bd",
    date: "2026",
    category: "Research",
    image:
      "https://assets-c4akfrf5b4d3f4b7.z01.azurefd.net/assets/2026/05/2026_WorkTrendIndex_Hero_-1920x1080_69f91cd0ef419.png",
  },
  {
    id: "gcloud-agentic-era",
    source: "Google Cloud",
    title: "What it takes to get your team ready for the agentic era",
    summary:
      "Google Cloud's playbook on the skills, operating model and culture leaders need to thrive in an agentic workplace.",
    href: "https://cloud.google.com/transform/what-it-takes-to-get-your-team-ready-for-the-agentic-era",
    date: "2026",
    category: "Operators",
    image:
      "https://storage.googleapis.com/gweb-cloudblog-publish/images/GettyImages-1887444241.max-2600x2600.jpg",
  },
  {
    id: "gartner-hr-survey-2026",
    source: "Gartner",
    title: "45% of managers report AI has lived up to their expectations",
    summary:
      "Gartner HR survey reveals where AI is delivering for managers — and where the expectations gap is widening.",
    href: "https://www.gartner.com/en/newsroom/press-releases/2026-3-4-gartner-hr-survey-reveals-45-percent-of-managers-report-ai-has-lived-up-to-their-expectations",
    date: "2026",
    category: "Analyst",
    image: "https://logo.clearbit.com/gartner.com",
  },
  {
    id: "mit-sloan-reshaping-workflows",
    source: "MIT Sloan",
    title: "How AI is reshaping workflows and redefining jobs",
    summary:
      "MIT Sloan on how chained AI tasks are restructuring work and what leaders should redesign first.",
    href: "https://mitsloan.mit.edu/ideas-made-to-matter/how-ai-reshaping-workflows-and-redefining-jobs",
    date: "2026",
    category: "Research",
    image:
      "https://mitsloan.mit.edu/sites/default/files/styles/og_image/public/2026-04/ai-chaining-tasks2.jpg.webp?h=9e01ee4b&itok=y4C0Q98c",
  },
  {
    id: "basf-alphaevolve",
    source: "Google Cloud",
    title: "How BASF manages thousands of supply chain decisions with AlphaEvolve",
    summary:
      "Inside BASF's deployment of AlphaEvolve to orchestrate complex supply-chain decisions at industrial scale.",
    href: "https://cloud.google.com/blog/products/ai-machine-learning/how-basf-manages-thousands-of-supply-chain-decisions-with-alphaevolve",
    date: "2026",
    category: "Operators",
    image:
      "https://storage.googleapis.com/gweb-cloudblog-publish/images/image1_BFm5ksn.max-1500x1500.jpg",
  },
  {
    id: "aws-nonprofit-agentic-governance",
    source: "AWS",
    title: "A governance framework for nonprofit agentic AI on AWS",
    summary:
      "AWS lays out a governance framework for nonprofits deploying agentic AI responsibly and at scale.",
    href: "https://aws.amazon.com/blogs/publicsector/a-governance-framework-for-nonprofit-agentic-ai-on-aws/",
    date: "2026",
    category: "Regulation",
    image:
      "https://d2908q01vomqb2.cloudfront.net/9e6a55b6b4563e652a23be9d623ca5055c356940/2026/05/09/A-governance-framework-for-nonprofit-agentic-AI-on-AWS.png",
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

      {/* Featured banner */}
      <section className="mt-6 overflow-hidden rounded-2xl border-2 border-[#02459c] bg-card shadow-card">
        <img
          src={marketTrendsBanner}
          alt="Market Trends Report — Agentic AI benchmarking study"
          className="w-full h-auto object-cover"
          loading="lazy"
        />
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
                <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#02459c] hover:shadow-elegant">
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
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
                        "absolute right-2 top-2 rounded-full p-1.5 backdrop-blur transition-colors " +
                        (saved
                          ? "bg-[#ff6f00] text-white hover:bg-[#ff6f00]/90"
                          : "bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground")
                      }
                    >
                      {saved ? (
                        <BookmarkCheck className="w-4 h-4" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
                      <span>{item.source}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{item.date}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal text-muted-foreground">
                        {item.category}
                      </span>
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
                  </div>
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

      <DigestSignup />
    </div>
  );
}

function DigestSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value) || value.length > 320) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    const { error } = await supabase
      .from("digest_subscribers")
      .insert({ email: value, source: "market-trends" });

    if (error && !/duplicate key|unique/i.test(error.message)) {
      setStatus("idle");
      toast.error("Couldn't subscribe right now. Please try again.");
      trackEvent("market_trends_digest_signup_error", { message: error.message });
      return;
    }

    setStatus("success");
    trackEvent("market_trends_digest_signup", { email: value });
    toast.success("You're in — check your inbox for the next digest.");
  };

  return (
    <section className="mt-10 rounded-2xl bg-gradient-primary p-6 text-primary-foreground shadow-elegant">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest opacity-90">
        <Mail className="w-4 h-4" />
        Weekly digest
      </div>
      <h2 className="mt-2 text-lg font-bold">Want this in your inbox?</h2>
      <p className="mt-1 text-sm opacity-95">
        Get the BizzSurfer weekly digest — Agentic AI news, benchmarks and
        operator playbooks.
      </p>

      {status === "success" ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
          <CheckCircle2 className="w-4 h-4" />
          Subscribed — see you next week.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col gap-2 sm:flex-row"
        >
          <label className="sr-only" htmlFor="digest-email">
            Email address
          </label>
          <Input
            id="digest-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            maxLength={320}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            disabled={status === "loading"}
            className="flex-1 bg-white text-foreground placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            disabled={status === "loading"}
            className="bg-white text-primary hover:bg-white/90"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Subscribing…
              </>
            ) : (
              <>
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      )}

      <p className="mt-3 text-xs opacity-80">
        No spam. Unsubscribe any time. Or{" "}
        <Link to="/insights" className="underline hover:opacity-100">
          explore all insights
        </Link>
        .
      </p>
    </section>
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
