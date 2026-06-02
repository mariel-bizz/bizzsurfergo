import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMarketNewsBySlug } from "@/lib/market-news.functions";

function truncate(s: string, n: number) {
  if (!s) return s;
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}

const SITE = "https://go.bizzsurfer.ai";

export const Route = createFileRoute("/bizzsurfer-news/$slug")({
  loader: async ({ params }) => {
    const { item } = await getMarketNewsBySlug({ data: { slug: params.slug } });
    if (!item) throw notFound();
    return { item };
  },
  head: ({ params, loaderData }) => {
    const item = loaderData?.item;
    const url = `${SITE}/bizzsurfer-news/${params.slug}`;
    const title = item
      ? truncate(`${item.title} — BizzSurfer`, 60)
      : "BizzSurfer News";
    const description = item
      ? truncate(item.summary || `${item.source} via BizzSurfer.`, 160)
      : "Agentic AI news, curated by BizzSurfer.";
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "article" },
      { property: "og:site_name", content: "BizzSurfer" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];
    if (item?.image_url) {
      meta.push({ property: "og:image", content: item.image_url });
      meta.push({ name: "twitter:image", content: item.image_url });
    }
    return { meta, links: [{ rel: "canonical", href: url }] };
  },
  component: BizzSurferNewsPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center">
        <AlertTriangle className="mx-auto w-10 h-10 text-destructive" />
        <h1 className="mt-3 text-xl font-bold">Couldn't load this article</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Button
          className="mt-6"
          onClick={() => {
            reset();
            router.invalidate();
          }}
        >
          Try again
        </Button>
      </div>
    );
  },
  notFoundComponent: () => {
    const { slug } = Route.useParams();
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center">
        <h1 className="text-xl font-bold">Article not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No BizzSurfer news item exists at <code>/bizzsurfer-news/{slug}</code>.
        </p>
        <Button asChild className="mt-6">
          <Link to="/market-trends">Back to Market Trends</Link>
        </Button>
      </div>
    );
  },
});

function BizzSurferNewsPage() {
  const { item } = Route.useLoaderData();
  const published = item.published_at
    ? new Date(item.published_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <Link
        to="/market-trends"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Market Trends
      </Link>

      <div className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary">
        <span>BizzSurfer News</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{item.category}</span>
      </div>

      <h1 className="mt-2 text-3xl font-bold text-foreground leading-tight">
        {item.title}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{item.source}</span>
        {published && (
          <>
            <span>·</span>
            <span>{published}</span>
          </>
        )}
      </div>

      {item.image_url && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      )}

      {item.summary && (
        <p className="mt-6 text-base leading-relaxed text-foreground">
          {item.summary}
        </p>
      )}

      <div className="mt-8 rounded-2xl border-2 border-solid border-[#02459c] bg-card p-5 shadow-elegant">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Read the original
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          This story was curated by BizzSurfer from {item.source}. Open the full
          article on the publisher's site.
        </p>
        <Button asChild className="mt-4">
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5"
          >
            Read on {item.source}
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </div>

      <div className="mt-10 rounded-2xl bg-gradient-primary p-6 text-primary-foreground shadow-elegant">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-90">
          Powered by BizzSurfer
        </p>
        <h2 className="mt-2 text-lg font-bold">Agentic AI, surfaced for leaders.</h2>
        <p className="mt-1 text-sm opacity-95">
          Get daily Agentic AI signal — benchmarks, operator playbooks, and the
          news that actually moves transformation forward.
        </p>
        <Button asChild className="mt-4 bg-white text-primary hover:bg-white/90">
          <Link to="/market-trends">See all Market Trends</Link>
        </Button>
      </div>
    </div>
  );
}
