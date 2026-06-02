import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  Lock,
  Heart,
  Loader2,
  CheckCircle2,
  Sparkles,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMarketNewsBySlug } from "@/lib/market-news.functions";
import { getMarketNewsBody } from "@/lib/market-news-body.functions";
import { getPremiumStatus } from "@/lib/premium.functions";
import { verifyNewsPass } from "@/lib/news-pass.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import {
  getStoredNewsPassExpiry,
  setStoredNewsPassExpiry,
} from "@/lib/news-pass-storage";
import { NewsPassCheckoutDialog } from "@/components/NewsPassCheckoutDialog";
import { supabase } from "@/integrations/supabase/client";
import bizzsurferLogo from "@/assets/bizzsurfer-logo.png";
import newsDefault from "@/assets/news-default.jpg";

function truncate(s: string, n: number) {
  if (!s) return s;
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}

const SITE = "https://go.bizzsurfer.ai";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Locale-stable date format — avoids SSR/client hydration mismatches.
function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export const Route = createFileRoute("/bizzsurfer-news/$slug")({
  loader: async ({ params }) => {
    const { item } = await getMarketNewsBySlug({ data: { slug: params.slug } });
    if (!item) throw notFound();
    return { item };
  },
  validateSearch: (s: Record<string, unknown>): { news_pass_session?: string } => ({
    news_pass_session:
      typeof s.news_pass_session === "string" ? s.news_pass_session : undefined,
  }),
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
    const ogImage = item?.image_url || `${SITE}${newsDefault}`;
    meta.push({ property: "og:image", content: ogImage });
    meta.push({ name: "twitter:image", content: ogImage });
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
  const { slug } = Route.useParams();
  const { news_pass_session } = Route.useSearch();
  const router = useRouter();

  const published = formatDate(item.published_at) ?? formatDate(item.created_at);

  // --- Access state ---------------------------------------------------------
  const [passExpiresAt, setPassExpiresAt] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Hydrate pass + supabase user only on the client (avoids SSR mismatch).
  useEffect(() => {
    setPassExpiresAt(getStoredNewsPassExpiry());
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const verifyPass = useServerFn(verifyNewsPass);
  const checkPremium = useServerFn(getPremiumStatus);

  // After Stripe redirects back with ?news_pass_session=... verify + store.
  useEffect(() => {
    if (!news_pass_session) return;
    setVerifying(true);
    verifyPass({
      data: { sessionId: news_pass_session, environment: getStripeEnvironment() },
    })
      .then((res) => {
        if (res.paid) {
          setStoredNewsPassExpiry(res.expiresAt);
          setPassExpiresAt(res.expiresAt);
        }
      })
      .catch(() => {})
      .finally(() => {
        setVerifying(false);
        // Strip the query param without reloading.
        router.navigate({
          to: "/bizzsurfer-news/$slug",
          params: { slug },
          search: {},
          replace: true,
        });
      });
  }, [news_pass_session, slug, verifyPass, router]);

  const premiumQuery = useQuery({
    queryKey: ["premium-status", userId],
    queryFn: () => checkPremium(),
    enabled: !!userId,
    staleTime: 60_000,
  });
  const isPremium = !!premiumQuery.data?.isPremium;
  const hasPass = passExpiresAt !== null && passExpiresAt > Date.now();
  const hasAccess = isPremium || hasPass;

  // --- Body -----------------------------------------------------------------
  const fetchBody = useServerFn(getMarketNewsBody);
  const bodyQuery = useQuery({
    queryKey: ["news-body", slug],
    queryFn: () => fetchBody({ data: { slug } }),
    staleTime: 5 * 60_000,
  });
  const paragraphs = useMemo(() => {
    const raw = bodyQuery.data?.body?.trim();
    if (!raw) return [] as string[];
    return raw
      .split(/\n{2,}/g)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [bodyQuery.data]);

  const PREVIEW_COUNT = 2;
  const previewParagraphs = paragraphs.slice(0, PREVIEW_COUNT);
  const gatedParagraphs = paragraphs.slice(PREVIEW_COUNT);

  // --- Image with fallback --------------------------------------------------
  const heroImage = item.image_url || newsDefault;

  // --- Return URL for Stripe ------------------------------------------------
  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/bizzsurfer-news/${slug}?news_pass_session={CHECKOUT_SESSION_ID}`
      : `${SITE}/bizzsurfer-news/${slug}?news_pass_session={CHECKOUT_SESSION_ID}`;

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
        {hasAccess && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            <CheckCircle2 className="w-3 h-3" />
            {isPremium ? "Premium" : "24h Pass"}
          </span>
        )}
      </div>

      {/* Hero image with BizzSurfer watermark */}
      <div className="relative mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <img
          src={heroImage}
          alt={item.title}
          className="w-full h-auto object-cover"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = newsDefault;
          }}
        />
        <img
          src={bizzsurferLogo}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 h-9 w-auto rounded-md bg-white/85 px-2 py-1 shadow-sm backdrop-blur-sm"
        />
      </div>

      {item.summary && (
        <p className="mt-6 text-base leading-relaxed text-foreground font-medium">
          {item.summary}
        </p>
      )}

      {/* Body */}
      <div className="mt-8 space-y-5">
        {bodyQuery.isLoading && (
          <div className="space-y-3">
            <div className="h-4 rounded bg-muted animate-pulse" />
            <div className="h-4 rounded bg-muted animate-pulse w-11/12" />
            <div className="h-4 rounded bg-muted animate-pulse w-10/12" />
            <div className="h-4 rounded bg-muted animate-pulse w-11/12" />
          </div>
        )}

        {previewParagraphs.map((p, i) => (
          <p key={`pv-${i}`} className="text-base leading-relaxed text-foreground">
            {p}
          </p>
        ))}

        {gatedParagraphs.length > 0 && (
          <div className="relative">
            <div
              className={
                hasAccess
                  ? "space-y-5"
                  : "space-y-5 pointer-events-none select-none [filter:blur(6px)] [transform:translateZ(0)]"
              }
              aria-hidden={!hasAccess}
            >
              {gatedParagraphs.map((p, i) => (
                <p key={`gp-${i}`} className="text-base leading-relaxed text-foreground">
                  {p}
                </p>
              ))}

              {/* Original-source CTA also gets blurred when locked */}
              <div className="mt-6 rounded-2xl border-2 border-solid border-[#02459c] bg-card p-5 shadow-elegant">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  READ THE FULL ORIGINAL ARTICLE
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This story was curated by BizzSurfer from {item.source}. Open
                  the full article on the publisher's site.
                </p>
                <Button asChild className="mt-4" disabled={!hasAccess}>
                  <a
                    href={hasAccess ? item.source_url : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5"
                    onClick={(e) => {
                      if (!hasAccess) e.preventDefault();
                    }}
                  >
                    Read on {item.source}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>

            {!hasAccess && (
              <PaywallOverlay
                isPremiumUser={!!userId}
                onUnlock={() => setPaywallOpen(true)}
                verifying={verifying}
              />
            )}
          </div>
        )}
      </div>

      {/* Powered-by footer */}
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

      <NewsPassCheckoutDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        returnUrl={returnUrl}
      />
    </div>
  );
}

function PaywallOverlay({
  isPremiumUser,
  onUnlock,
  verifying,
}: {
  isPremiumUser: boolean;
  onUnlock: () => void;
  verifying: boolean;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 top-1/4 flex items-end justify-center">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border-2 border-[#ff6f00] bg-card p-5 shadow-elegant text-center">
        {verifying ? (
          <>
            <Loader2 className="mx-auto w-6 h-6 animate-spin text-primary" />
            <p className="mt-2 text-sm font-semibold text-foreground">
              Confirming your payment…
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#ff6f00]/15">
              <Lock className="w-5 h-5 text-[#ff6f00]" />
            </div>
            <h3 className="mt-3 text-base font-bold text-foreground">
              Keep reading the full story
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Contribute <span className="font-bold text-foreground">€1</span> to
              get a 24-hour pass to every BizzSurfer News article.
              <br />
              100% of contributions go to{" "}
              <span className="font-semibold text-foreground">
                IT-skills programs for children
              </span>{" "}
              — building the next generation of operators.
            </p>
            <Button
              type="button"
              onClick={onUnlock}
              className="mt-4 w-full bg-[#ff6f00] text-white hover:bg-[#e85f00]"
            >
              <Heart className="w-4 h-4 mr-1.5" />
              Unlock for €1 — donate &amp; read
            </Button>
            {!isPremiumUser ? (
              <p className="mt-3 text-[11px] text-muted-foreground">
                <Sparkles className="inline w-3 h-3 mr-0.5 text-primary" />
                Have a Premium plan?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  <LogIn className="inline w-3 h-3 mr-0.5" />
                  Sign in for full access
                </Link>
              </p>
            ) : (
              <p className="mt-3 text-[11px] text-muted-foreground">
                Premium plans include unlimited access automatically.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
