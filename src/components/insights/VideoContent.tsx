import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import { videos, featuredVideo } from "@/lib/insights-media";

export function VideoContent() {
  const others = videos.filter((v) => v.id !== featuredVideo.id);

  return (
    <section id="video-content" className="mt-10 scroll-mt-20">
      <h2 className="mb-3 text-lg font-bold text-[#ff6f00]">Video Content</h2>

      {/* Featured */}
      <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-card">
        <div className="bg-black">
          <video
            src={featuredVideo.src}
            poster={featuredVideo.poster}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full"
          />
        </div>
        <CardContent className="space-y-3 p-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
          <h3 className="text-base font-bold text-foreground">{featuredVideo.title}</h3>
          <p className="text-sm text-muted-foreground">{featuredVideo.description}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm">
              <Link to="/chat">
                Chat to BizzSurfer Go! <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/events">See upcoming events</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {others.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {others.map((v) => (
            <Card key={v.id} className="overflow-hidden">
              <div className="bg-black">
                <video
                  src={v.src}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full"
                />
              </div>
              <CardContent className="space-y-1.5 p-4">
                <h3 className="text-sm font-bold text-foreground">{v.title}</h3>
                <p className="line-clamp-2 text-xs text-muted-foreground">{v.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

export function FeaturedVideoHome() {
  return (
    <section className="px-5">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-base font-bold uppercase tracking-wider text-foreground">Featured video</h2>
        <Link to="/insights" hash="video-content" className="text-xs font-semibold text-primary hover:underline">
          More videos →
        </Link>
      </div>
      <Card className="overflow-hidden border-2 border-primary/20">
        <div className="bg-black">
          <video
            src={featuredVideo.src}
            controls
            playsInline
            preload="metadata"
            poster=""
            className="aspect-video w-full"
          />
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center gap-1.5 text-primary">
            <PlayCircle className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Watch now</span>
          </div>
          <h3 className="text-base font-bold text-foreground">{featuredVideo.title}</h3>
          <p className="text-sm text-muted-foreground">{featuredVideo.description}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm">
              <Link to="/chat">
                Chat to BizzSurfer Go! <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/insights" hash="video-content">
                Watch more
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
