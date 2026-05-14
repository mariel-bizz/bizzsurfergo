import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Headphones } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-head";
import { trackEvent } from "@/lib/analytics";
import bizzsurferLogo from "@/assets/bizzsurfer-logo.webp";

const SPOTIFY_USER_ID = "31l6phq64rtvbtqbgeyozhlbpyly";
const SPOTIFY_URL = `https://open.spotify.com/user/${SPOTIFY_USER_ID}`;
const SPOTIFY_EMBED = `https://open.spotify.com/embed/user/${SPOTIFY_USER_ID}?utm_source=generator&theme=0`;

export const Route = createFileRoute("/podcast")({
  head: () => {
    const base = pageHead({
      path: "/podcast",
      title: "BizzSurfer Podcast — Operators Behind Enterprise Agentic AI",
      description:
        "Listen on Spotify: candid conversations with founders, CIOs, and operators shipping Agentic AI in production. New episodes every week.",
      breadcrumbName: "Podcast",
    });
    const ogImage = "https://bizzsurfergo.lovable.app/og-podcast.jpg";
    return {
      ...base,
      meta: [
        ...base.meta.filter(
          (m) => !("property" in m && m.property === "og:type"),
        ),
        { property: "og:type", content: "music.playlist" },
        { property: "og:audio", content: SPOTIFY_URL },
        { property: "og:image", content: ogImage },
        { property: "og:image:width", content: "1216" },
        { property: "og:image:height", content: "640" },
        { property: "og:image:alt", content: "BizzSurfer Podcast — Operators behind enterprise Agentic AI" },
        { property: "music:creator", content: "BizzSurfer" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: ogImage },
        { name: "twitter:image:alt", content: "BizzSurfer Podcast cover" },
        { name: "twitter:label1", content: "Listen on" },
        { name: "twitter:data1", content: "Spotify" },
      ],
    };
  },
  component: PodcastPage,
});

function PodcastPage() {
  const sectionRef = useRef<HTMLElement>(null);
  const interactedRef = useRef(false);
  const interactionStartRef = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const engagementFiredRef = useRef(false);

  const fireEngagement = (reason: string) => {
    if (engagementFiredRef.current) return;
    if (interactionStartRef.current == null) return;
    engagementFiredRef.current = true;
    const duration_ms = Math.round(performance.now() - interactionStartRef.current);
    trackEvent("podcast_engagement_ended", { duration_ms, reason });
  };

  // First interaction + engagement timer
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onInteract = (ev: Event) => {
      if (interactedRef.current) return;
      interactedRef.current = true;
      interactionStartRef.current = performance.now();
      trackEvent("podcast_interaction_started", { type: ev.type });
    };
    const events: (keyof DocumentEventMap)[] = ["pointerdown", "touchstart", "keydown"];
    events.forEach((e) => el.addEventListener(e, onInteract, { capture: true, once: false }));

    const onBlur = () => {
      if (!interactedRef.current && document.activeElement?.tagName === "IFRAME") {
        interactedRef.current = true;
        interactionStartRef.current = performance.now();
        trackEvent("podcast_interaction_started", { type: "iframe_focus" });
      }
    };
    window.addEventListener("blur", onBlur);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") fireEngagement("visibility_hidden");
    };
    const onPageHide = () => fireEngagement("pagehide");
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      events.forEach((e) => el.removeEventListener(e, onInteract, { capture: true }));
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      fireEngagement("unmount");
    };
  }, []);

  // Viewport visibility — fire once when section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let fired = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            if (!visibleRef.current) {
              visibleRef.current = true;
              if (!fired) {
                fired = true;
                trackEvent("podcast_section_viewed", {
                  ratio: Number(entry.intersectionRatio.toFixed(2)),
                });
              }
            }
          } else if (entry.intersectionRatio === 0) {
            if (visibleRef.current) {
              visibleRef.current = false;
              fireEngagement("scrolled_out_of_view");
            }
          }
        }
      },
      { threshold: [0, 0.25, 0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const trackOutbound = (label: string, url: string) =>
    trackEvent("podcast_outbound_click", { label, url, destination: "spotify" });

  return (
    <section ref={sectionRef} className="px-5 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-elegant">
          <Headphones className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">BizzSurfer Podcast</h1>
          <p className="text-sm text-muted-foreground">Operators behind enterprise Agentic AI.</p>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-deep p-6 text-white shadow-elegant space-y-4">
        <div className="flex items-center gap-3">
          <img
            src={bizzsurferLogo}
            alt="BizzSurfer logo"
            className="w-12 h-12 rounded-xl bg-white/95 p-1.5 object-contain shadow-md"
          />
          <div>
            <p className="text-[11px] uppercase tracking-widest opacity-90 font-semibold">Now streaming</p>
            <p className="text-base font-bold">Listen on Spotify</p>
          </div>
        </div>
        <p className="text-sm opacity-95">
          Real talk with builders, founders, and transformation leaders shipping Agentic AI in production.
        </p>
        <Button
          asChild
          size="lg"
          className="w-full bg-white text-primary hover:bg-white/90 font-bold"
        >
          <a
            href={SPOTIFY_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackOutbound("open_in_spotify_cta", SPOTIFY_URL)}
            onAuxClick={() => trackOutbound("open_in_spotify_cta_aux", SPOTIFY_URL)}
          >
            Open in Spotify <ExternalLink className="ml-2 w-4 h-4" />
          </a>
        </Button>
      </div>

      <div className="rounded-3xl overflow-hidden shadow-card border border-border bg-card">
        <iframe
          data-testid="embed-iframe"
          title="Featured playlist"
          src="https://open.spotify.com/embed/playlist/0IgXD871X03xf0c57UpNnS?utm_source=generator"
          width="100%"
          height={352}
          frameBorder={0}
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style={{ borderRadius: 12 }}
          className="block w-full"
          onLoad={() => trackEvent("podcast_embed_loaded", { title: "Featured playlist (highlight)", kind: "playlist" })}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground">Featured playlist & show</h2>
        {[
          { title: "Featured playlist", kind: "playlist", src: "https://open.spotify.com/embed/playlist/6Jvb9W4LCZ6pNpVDlFzayF?utm_source=generator&theme=0" },
          { title: "Featured show", kind: "show", src: "https://open.spotify.com/embed/show/3sNWski1Zw9mGauajOdToS?utm_source=generator&theme=0" },
          { title: "Latest episode", kind: "episode", src: "https://open.spotify.com/embed/episode/0HJ2oPYS3w5T6UUiUiIAs9?utm_source=generator&theme=0" },
          { title: "Recommended episode", kind: "episode", src: "https://open.spotify.com/embed/episode/5SmYUmU9twq0jf4VGioVca?utm_source=generator&theme=0" },
        ].map((e) => (
          <div key={e.src} className="rounded-3xl overflow-hidden shadow-card border border-border bg-card">
            <iframe
              title={e.title}
              src={e.src}
              width="100%"
              height="352"
              frameBorder={0}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ borderRadius: 12 }}
              className="block w-full"
              onLoad={() => trackEvent("podcast_embed_loaded", { title: e.title, kind: e.kind })}
            />
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-card border border-border p-5 shadow-card">
        <h2 className="text-base font-bold text-foreground">What you'll hear</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• Behind-the-scenes of agentic deployments at scale</li>
          <li>• Frameworks for AI transformation across functions</li>
          <li>• Honest conversations on cost, governance, and ROI</li>
        </ul>
      </div>
    </section>
  );
}
