import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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

const TT_URL = "https://coach4expats.teamtailor.com/";

function CareersPage() {
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [widgetFailed, setWidgetFailed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    (window as any).teamtailorSettings = {
      ...((window as any).teamtailorSettings || {}),
      widgetPosition: "bottom-right",
      color: "#f28328",
      locale: "",
      company: "coach4expats.teamtailor.com",
    };

    const settings = (window as any).teamtailorSettings;
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.async = true;
    s.src = `https://${settings.company}/widget${settings.locale}`;
    s.onload = () => setWidgetLoaded(true);
    s.onerror = () => setWidgetFailed(true);
    document.body.appendChild(s);

    // Fallback: if widget hasn't loaded after 6s, treat as failed
    const timeout = window.setTimeout(() => {
      if (!(window as any).teamtailor && !widgetLoaded) {
        setWidgetFailed(true);
      }
    }, 6000);

    return () => {
      window.clearTimeout(timeout);
      s.parentNode?.removeChild(s);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[60vh] px-5 py-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground">Careers</h1>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
        Help us build the agentic future. Browse open roles below — the widget
        appears at the bottom-right of this page.
      </p>

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
            coach4expats.teamtailor.com
          </a>
          .
        </div>
      </noscript>

      {widgetFailed && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
            Our jobs widget couldn't load — this can happen if scripts are
            blocked. Please enable scripts for this page, or browse roles
            directly below.{" "}
            <a
              href={TT_URL}
              className="underline text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in a new tab ↗
            </a>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            <iframe
              src={TT_URL}
              title="BizzSurfer open roles — Teamtailor"
              className="w-full h-[80vh] min-h-[600px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}
    </div>
  );
}
