import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Headphones, Music } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-head";
import { trackEvent } from "@/lib/analytics";

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
  return (
    <section className="px-5 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-elegant">
          <Headphones className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">BizzSurfer Podcast</h1>
          <p className="text-sm text-muted-foreground">Operators behind enterprise Agentic AI.</p>
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden shadow-elegant border border-border bg-card">
        <iframe
          title="BizzSurfer on Spotify"
          src={SPOTIFY_EMBED}
          width="100%"
          height="352"
          frameBorder={0}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="block w-full"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground">Featured playlist & show</h2>
        {[
          { title: "Featured playlist", src: "https://open.spotify.com/embed/playlist/6Jvb9W4LCZ6pNpVDlFzayF?utm_source=generator&theme=0" },
          { title: "Featured show", src: "https://open.spotify.com/embed/show/3sNWski1Zw9mGauajOdToS?utm_source=generator&theme=0" },
          { title: "Latest episode", src: "https://open.spotify.com/embed/episode/0HJ2oPYS3w5T6UUiUiIAs9?utm_source=generator&theme=0" },
          { title: "Recommended episode", src: "https://open.spotify.com/embed/episode/5SmYUmU9twq0jf4VGioVca?utm_source=generator&theme=0" },
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
            />
          </div>
        ))}
      </div>


      <div className="rounded-3xl bg-gradient-deep p-6 text-white shadow-elegant space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Music className="w-5 h-5" />
          </div>
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
          <a href={SPOTIFY_URL} target="_blank" rel="noopener noreferrer">
            Open in Spotify <ExternalLink className="ml-2 w-4 h-4" />
          </a>
        </Button>
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
