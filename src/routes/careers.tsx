import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

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

function CareersPage() {
  useEffect(() => {
    // Teamtailor widget config
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
    s.src = `//${settings.company}/widget${settings.locale}`;
    document.body.appendChild(s);

    return () => {
      s.parentNode?.removeChild(s);
    };
  }, []);

  return (
    <div className="min-h-[60vh] px-5 py-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground">Careers</h1>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
        Help us build the agentic future. Open roles load in the widget at the
        bottom-right of this page.
      </p>
    </div>
  );
}
