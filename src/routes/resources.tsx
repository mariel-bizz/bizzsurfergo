import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { pageHead } from "@/lib/page-head";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const INSIGHTS_URL = "https://bizzsurfer.com/insights";
const LOAD_TIMEOUT_MS = 8000;

export const Route = createFileRoute("/resources")({
  head: () =>
    pageHead({
      path: "/resources",
      title: "Blog & Resources — BizzSurfer Go!",
      description:
        "Insights, articles and resources from BizzSurfer for transformation leaders exploring Agentic AI.",
      breadcrumbName: "Blog & Resources",
    }),
  component: ResourcesPage,
});

type Status = "loading" | "loaded" | "error";
type IframeEvent = "loaded" | "error" | "timeout" | "retry";

function trackIframeEvent(event: IframeEvent, durationMs?: number) {
  const path = durationMs != null ? `${event}?ms=${durationMs}` : event;
  void supabase
    .from("outbound_clicks")
    .insert({
      source: "resources_iframe",
      destination: INSIGHTS_URL,
      path,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    })
    .then(({ error }) => {
      if (error) console.warn("[analytics] iframe event failed", event, error.message);
    });
}

function ResourcesPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const reportedRef = useRef<boolean>(false);

  useEffect(() => {
    setStatus("loading");
    reportedRef.current = false;
    startedAtRef.current = Date.now();
    timeoutRef.current = setTimeout(() => {
      setStatus((s) => {
        if (s === "loading" && !reportedRef.current) {
          reportedRef.current = true;
          trackIframeEvent("timeout", Date.now() - startedAtRef.current);
          return "error";
        }
        return s;
      });
    }, LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [reloadKey]);

  const handleLoad = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!reportedRef.current) {
      reportedRef.current = true;
      trackIframeEvent("loaded", Date.now() - startedAtRef.current);
    }
    setStatus("loaded");
  }, []);

  const handleError = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!reportedRef.current) {
      reportedRef.current = true;
      trackIframeEvent("error", Date.now() - startedAtRef.current);
    }
    setStatus("error");
  }, []);

  const retry = () => {
    trackIframeEvent("retry");
    setReloadKey((k) => k + 1);
  };

  return (
    <section className="px-4 pt-4 pb-2">
      <header className="mb-3">
        <h1 className="text-2xl font-bold text-foreground">Blog &amp; Resources</h1>
        <p className="text-sm text-muted-foreground">
          Latest insights from BizzSurfer.
        </p>
      </header>

      <div className="relative rounded-2xl overflow-hidden border border-border shadow-elegant bg-card">
        {status === "error" ? (
          <ErrorFallback onRetry={retry} />
        ) : (
          <>
            {status === "loading" && <LoadingSkeleton />}
            <iframe
              key={reloadKey}
              src={INSIGHTS_URL}
              title="BizzSurfer Insights"
              className={`w-full h-[75vh] bg-background transition-opacity duration-300 ${
                status === "loaded" ? "opacity-100" : "opacity-0 absolute inset-0"
              }`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={handleLoad}
              onError={handleError}
            />
          </>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Having trouble viewing?{" "}
        <a
          href={INSIGHTS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold underline"
        >
          Open on bizzsurfer.com
        </a>
      </p>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div
      className="w-full h-[75vh] p-5 space-y-4 bg-background"
      role="status"
      aria-label="Loading insights"
    >
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="grid grid-cols-2 gap-3 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading BizzSurfer insights…</span>
    </div>
  );
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="w-full h-[75vh] flex flex-col items-center justify-center text-center px-6 bg-background">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <h2 className="text-base font-bold text-foreground">Couldn't load insights</h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-xs">
        The BizzSurfer insights page is taking too long or refused to embed. You can retry or open it in a new tab.
      </p>
      <div className="mt-5 flex flex-col sm:flex-row gap-2 w-full max-w-xs">
        <Button onClick={onRetry} variant="outline" className="flex-1">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
        <Button asChild className="flex-1">
          <a href={INSIGHTS_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" /> Open site
          </a>
        </Button>
      </div>
    </div>
  );
}
