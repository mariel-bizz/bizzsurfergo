import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download, ExternalLink, FileText, Newspaper, TrendingUp } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import marketTrendsCover from "@/assets/market-trends-card.png";

export const Route = createFileRoute("/market-trends")({
  head: () => ({
    meta: [
      { title: "Market Trends — Agentic AI News & Benchmarks | BizzSurfer" },
      {
        name: "description",
        content:
          "The latest Agentic AI news, market trends, and benchmarking studies for enterprise transformation leaders.",
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

type NewsItem = {
  source: string;
  title: string;
  summary: string;
  href: string;
  date: string;
};

const REPORT_URL = "https://www.bizzsurfer.com/reports";

const NEWS: NewsItem[] = [
  {
    source: "Gartner",
    title: "Agentic AI predicted to autonomously resolve 80% of common service issues by 2029",
    summary:
      "Gartner forecasts that agentic AI will drive a 30% reduction in operational costs across customer service operations.",
    href: "https://www.gartner.com/en/newsroom/press-releases/2025-03-05-gartner-predicts-agentic-ai-will-autonomously-resolve-80-percent-of-common-customer-service-issues",
    date: "2025",
  },
  {
    source: "McKinsey",
    title: "The state of AI: Agentic systems move from pilots to production",
    summary:
      "Enterprises shifting from copilots to autonomous agents are seeing measurable EBITDA impact in finance, supply chain, and CX.",
    href: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
    date: "2025",
  },
  {
    source: "MIT Sloan",
    title: "Why most agentic AI projects stall — and what the leaders do differently",
    summary:
      "Successful programs invest in tool orchestration, evaluation harnesses, and human-in-the-loop guardrails from day one.",
    href: "https://sloanreview.mit.edu/topic/artificial-intelligence/",
    date: "2025",
  },
  {
    source: "a16z",
    title: "The agentic stack: from LLM apps to autonomous workflows",
    summary:
      "Andreessen Horowitz maps the emerging agentic infrastructure layer — orchestration, memory, tools, and evaluation.",
    href: "https://a16z.com/ai/",
    date: "2025",
  },
  {
    source: "Forrester",
    title: "Agentic AI reshapes the enterprise software contract",
    summary:
      "Buyers are renegotiating SaaS deals to include outcome-based pricing as agents replace seat-based usage.",
    href: "https://www.forrester.com/blogs/category/artificial-intelligence-ai/",
    date: "2025",
  },
  {
    source: "BizzSurfer Insights",
    title: "How transformation leaders are operationalising Agentic AI",
    summary:
      "Playbooks, frameworks and benchmarks from operators shipping autonomous workflows in regulated enterprises.",
    href: "/insights",
    date: "Weekly",
  },
];

function MarketTrendsPage() {
  const trackOutbound = (item: NewsItem) =>
    trackEvent("market_trends_news_click", {
      source: item.source,
      title: item.title,
      url: item.href,
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

        <ul className="mt-4 grid gap-3">
          {NEWS.map((item) => {
            const isInternal = item.href.startsWith("/");
            const inner = (
              <article className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#02459c] hover:shadow-elegant">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
                  <span>{item.source}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{item.date}</span>
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
              <li key={item.title}>
                {isInternal ? (
                  <Link to={item.href} onClick={() => trackOutbound(item)} className="block">
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
        </ul>
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
