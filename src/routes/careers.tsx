import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  ExternalLink,
  Filter,
  Globe,
  Heart,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/careers")({
  component: CareersPage,
  head: () => ({
    meta: [
      { title: "Careers — BizzSurfer" },
      {
        name: "description",
        content:
          "Help us build the agentic future. Explore open roles at BizzSurfer.",
      },
    ],
  }),
});

const TT_HOST = "coach4expats.teamtailor.com";
const TT_URL = `https://${TT_HOST}/`;
const TT_JOBS_URL = `https://${TT_HOST}/jobs`;

type Status = "loading" | "ready" | "failed";

const BENEFITS = [
  { icon: Globe, label: "Remote-first across the EU" },
  { icon: Heart, label: "Health, learning & wellness budget" },
  { icon: Sparkles, label: "Equity in an Agentic AI category leader" },
  { icon: Users, label: "Small senior team, big ownership" },
];

const LOCATIONS = ["Any", "Remote (EU)", "Madrid", "Barcelona", "Berlin", "London"];
const FUNCTIONS = ["Any", "Engineering", "AI / ML", "Product", "Design", "Sales", "Operations"];
const JOB_TYPES = ["Any", "Full-time", "Part-time", "Contract", "Internship"];

function buildTtFilterUrl(opts: { q: string; location: string; fn: string; type: string }) {
  const params = new URLSearchParams();
  if (opts.q.trim()) params.set("query", opts.q.trim());
  if (opts.location !== "Any") params.set("location", opts.location);
  if (opts.fn !== "Any") params.set("department", opts.fn);
  if (opts.type !== "Any") params.set("employment-type", opts.type);
  const qs = params.toString();
  return qs ? `${TT_JOBS_URL}?${qs}` : TT_JOBS_URL;
}

function CareersPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const loadStartRef = useRef<number>(0);

  // Filters
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("Any");
  const [fn, setFn] = useState("Any");
  const [jobType, setJobType] = useState("Any");

  const reload = useCallback(() => {
    trackEvent("careers_widget_retry", {});
    setStatus("loading");
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    loadStartRef.current = performance.now();
    trackEvent("careers_widget_load_attempt", { attempt: reloadKey + 1 });

    // Reset any prior widget instance so re-injecting actually reruns
    delete (window as any).teamtailor;
    (window as any).teamtailorSettings = {
      ...((window as any).teamtailorSettings || {}),
      widgetPosition: "bottom-right",
      color: "#f28328",
      locale: "",
      company: TT_HOST,
    };

    const settings = (window as any).teamtailorSettings;
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.async = true;
    s.src = `https://${settings.company}/widget${settings.locale}`;
    s.onload = () => {
      const duration_ms = Math.round(performance.now() - loadStartRef.current);
      setStatus("ready");
      trackEvent("careers_widget_loaded", { duration_ms, attempt: reloadKey + 1 });
    };
    s.onerror = () => {
      const duration_ms = Math.round(performance.now() - loadStartRef.current);
      setStatus("failed");
      trackEvent("careers_widget_failed", {
        reason: "script_error",
        duration_ms,
        attempt: reloadKey + 1,
      });
    };
    document.body.appendChild(s);

    const timeout = window.setTimeout(() => {
      if (!(window as any).teamtailor) {
        const duration_ms = Math.round(performance.now() - loadStartRef.current);
        setStatus((prev) => {
          if (prev !== "ready") {
            trackEvent("careers_widget_failed", {
              reason: "timeout",
              duration_ms,
              attempt: reloadKey + 1,
            });
            return "failed";
          }
          return prev;
        });
      }
    }, 6000);

    return () => {
      window.clearTimeout(timeout);
      s.parentNode?.removeChild(s);
    };
  }, [reloadKey]);

  const trackOutbound = useCallback(
    (label: string, url: string) =>
      trackEvent("careers_outbound_click", { label, url, destination: "teamtailor" }),
    [],
  );

  const filterUrl = useMemo(
    () => buildTtFilterUrl({ q, location, fn, type: jobType }),
    [q, location, fn, jobType],
  );

  const onApplyFilters = () => {
    trackEvent("careers_filters_applied", {
      query: q.trim() || null,
      location,
      function: fn,
      job_type: jobType,
    });
    trackOutbound("filtered_search", filterUrl);
    if (typeof window !== "undefined") {
      window.open(filterUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-[60vh] px-5 py-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground">Careers</h1>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
        Help us build the agentic future. Browse open roles below — the widget
        appears at the bottom-right of this page.
      </p>

      {/* CTA + benefits */}
      <section className="mt-6 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/10 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground">Join the team</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We're hiring builders, operators, and applied-AI engineers shipping
              autonomous workflows for enterprise transformation.
            </p>
          </div>
        </div>

        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {BENEFITS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm text-foreground"
            >
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <span>{label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={TT_JOBS_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackOutbound("join_the_team_cta", TT_JOBS_URL)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            Join the team <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href={TT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackOutbound("careers_home_link", TT_URL)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition"
          >
            Visit careers site <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      <noscript>
        <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
          Please enable JavaScript to view our open roles. You can also visit
          our careers site directly at{" "}
          <a
            href={TT_URL}
            className="underline text-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            {TT_HOST}
          </a>
          .
        </div>
      </noscript>

      {status === "loading" && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading our jobs widget…
        </div>
      )}

      {status === "failed" && (
        <section
          role="alert"
          aria-live="polite"
          className="mt-6 space-y-5"
        >
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-foreground">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground">
                  We couldn't load the jobs widget
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This usually happens when scripts are blocked, or the careers
                  provider can't be embedded here. Try again, or browse open
                  roles on our careers site.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={reload} className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Retry
                  </Button>
                  <a
                    href={TT_JOBS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackOutbound("fallback_open_jobs", TT_JOBS_URL)}
                    className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition"
                  >
                    Open careers site <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Search & filters fallback */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Browse roles by what matters to you
              </h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick filters and we'll open the matching results on our careers
              site.
            </p>

            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">
                  Search
                </span>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="e.g. AI engineer, customer success…"
                    className="pl-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onApplyFilters();
                    }}
                  />
                </div>
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                <FilterSelect
                  label="Location"
                  value={location}
                  onChange={setLocation}
                  options={LOCATIONS}
                />
                <FilterSelect
                  label="Function"
                  value={fn}
                  onChange={setFn}
                  options={FUNCTIONS}
                />
                <FilterSelect
                  label="Job type"
                  value={jobType}
                  onChange={setJobType}
                  options={JOB_TYPES}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button onClick={onApplyFilters} className="gap-2">
                  <Search className="w-4 h-4" /> Search roles
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setLocation("Any");
                    setFn("Any");
                    setJobType("Any");
                    trackEvent("careers_filters_cleared", {});
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
