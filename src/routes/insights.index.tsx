import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { pageHead } from "@/lib/page-head";
import { getBlogPosts } from "@/lib/contentful.functions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Calendar, Search, User, ArrowRight, Sparkles, BookOpen, Video, Music2, Youtube } from "lucide-react";

export const Route = createFileRoute("/insights/")({
  head: () => {
    const base = pageHead({
      path: "/insights",
      title: "Blog & Insights — BizzSurfer Go!",
      description:
        "Playbooks, frameworks and insights for transformation leaders exploring Agentic AI.",
      breadcrumbName: "Insights",
    });
    // Canonical points to marketing site so SEO/views consolidate on www.bizzsurfer.com.
    const blogLd = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": "https://go.bizzsurfer.ai/insights#blog",
      name: "BizzSurfer Insights",
      description: "Playbooks, frameworks and insights for transformation leaders exploring Agentic AI.",
      url: "https://go.bizzsurfer.ai/insights",
      publisher: { "@type": "Organization", name: "BizzSurfer", url: "https://go.bizzsurfer.ai" },
    };
    return {
      ...base,
      links: [{ rel: "canonical", href: "https://www.bizzsurfer.com/insights" }],
      scripts: [
        ...(base.scripts ?? []),
        { type: "application/ld+json", children: JSON.stringify(blogLd) },
      ],
    };
  },
  component: InsightsPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="px-4 py-10 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
        <h1 className="mt-3 text-lg font-bold">Couldn't load insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        <Button
          className="mt-4"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Retry
        </Button>
      </div>
    );
  },
});

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function prettyCategory(c: string | null) {
  if (!c) return "";
  return c
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function InsightsPage() {
  const fetchPosts = useServerFn(getBlogPosts);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => fetchPosts(),
    staleTime: 5 * 60 * 1000,
  });

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (data || []).forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    return (data || []).filter((p) => {
      if (category && p.category !== category) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          (p.author?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [data, query, category]);

  return (
    <section className="px-4 pt-4 pb-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">Blog &amp; Insights</h1>
        <p className="text-sm text-muted-foreground">
          Playbooks, frameworks and insights from BizzSurfer.
        </p>
      </header>

      <nav aria-label="Insights sections" className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <a
          href="#blog-articles"
          className="group flex items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card transition hover:border-primary/40 hover:shadow-soft"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-foreground group-hover:text-primary">Blog Articles</span>
        </a>
        <Link
          to="/events"
          hash="past"
          className="group flex items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card transition hover:border-primary/40 hover:shadow-soft"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0a66c2]/10 text-[#0a66c2]">
            <Video className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-foreground group-hover:text-primary">Rewatch webinars</span>
        </Link>
        <a
          href="https://open.spotify.com/user/31l6phq64rtvbtqbgeyozhlbpyly"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card transition hover:border-primary/40 hover:shadow-soft"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1db954]/10 text-[#1db954]">
            <Music2 className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-foreground group-hover:text-primary">Spotify</span>
        </a>
        <a
          href="https://youtube.com/@bizzsurfer"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card transition hover:border-primary/40 hover:shadow-soft"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff0000]/10 text-[#ff0000]">
            <Youtube className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-foreground group-hover:text-primary">YouTube</span>
        </a>
      </nav>

      <h2 id="blog-articles" className="mb-3 scroll-mt-20 text-lg font-bold text-[#ff6f00]">Blog Articles</h2>

      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            className="pl-9"
            aria-label="Search articles"
          />
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                category === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  category === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {prettyCategory(c)}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && <ListSkeleton />}

      {isError && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <h2 className="mt-3 text-base font-bold">Couldn't load insights</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {(error as Error)?.message || "Please try again."}
          </p>
          <Button className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 text-base font-bold">No articles found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search or clear your filters.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((post) => (
          <Link
            key={post.id}
            to="/insights/$slug"
            params={{ slug: post.slug }}
            className="group block"
          >
            <Card className="h-full overflow-hidden transition hover:shadow-elegant">
              {post.featuredImage && (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={`${post.featuredImage.url}?w=800&fm=webp&q=75`}
                    alt={post.featuredImage.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </div>
              )}
              <CardContent className="space-y-2 p-4">
                {post.category && (
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                    {prettyCategory(post.category)}
                  </Badge>
                )}
                <h2 className="line-clamp-2 text-base font-bold text-foreground group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
                  {post.author && (
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" /> {post.author}
                    </span>
                  )}
                  {post.publishedDate && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDate(post.publishedDate)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <CtaBlock />
    </section>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-video w-full" />
          <CardContent className="space-y-2 p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CtaBlock() {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="flex flex-col items-start gap-3 p-5">
          <h3 className="text-lg font-bold">Book a demo</h3>
          <p className="text-sm opacity-90">
            See how BizzSurfer accelerates Agentic AI transformation.
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-auto">
            <a href="https://www.bizzsurfer.com" target="_blank" rel="noopener noreferrer">
              Book a demo <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
      <Card className="border-2 border-primary/20">
        <CardContent className="flex flex-col items-start gap-3 p-5">
          <h3 className="text-lg font-bold">Explore BizzSurfer</h3>
          <p className="text-sm text-muted-foreground">
            Tools, calculators and resources for transformation leaders.
          </p>
          <Button asChild size="sm" className="mt-auto">
            <Link to="/">
              Explore <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
