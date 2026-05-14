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
        <div className="mt-6 rounded-xl border border-border bg-muted/40 p-6 text-sm text-foreground">
          <h2 className="text-base font-semibold text-foreground">
            View our open roles
          </h2>
          <p className="mt-2 text-muted-foreground">
            Our embedded jobs widget couldn't load here — this usually happens
            when scripts are blocked, or because our careers provider doesn't
            allow being embedded in another page. You can browse all current
            openings on our careers site:
          </p>
          <a
            href={TT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            Open BizzSurfer Careers ↗
          </a>
          <p className="mt-3 text-xs text-muted-foreground">
            Tip: if you're using a script blocker, allow{" "}
            <code className="font-mono">teamtailor.com</code> on this page to
            see roles inline.
          </p>
        </div>
      )}
    </div>
  );
}
