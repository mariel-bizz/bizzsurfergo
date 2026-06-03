import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Linkedin, MessageCircle, Mail, Link2, Check, FileText, Presentation } from "lucide-react";
import { downloadResources, SITE_ORIGIN, type DownloadResource } from "@/lib/insights-media";
import { toast } from "sonner";

function fileUrl(r: DownloadResource) {
  // Always use the production origin so the link resolves outside the
  // preview environment (which gates static files behind a Lovable login).
  return `${SITE_ORIGIN}${r.file}`;
}

const categoryStyles: Record<string, { gradient: string; icon: typeof FileText; label: string }> = {
  Webinar: {
    gradient: "from-[#02459c] via-[#0357c2] to-[#ff6f00]",
    icon: Presentation,
    label: "Webinar deck",
  },
  Carousel: {
    gradient: "from-[#ff6f00] via-[#ff8c1a] to-[#ffad1f]",
    icon: FileText,
    label: "PDF carousel",
  },
};

function PreviewHeader({ r }: { r: DownloadResource }) {
  const meta = categoryStyles[r.category] ?? categoryStyles.Carousel;
  const Icon = meta.icon;
  return (
    <div
      className={`relative h-32 w-full overflow-hidden bg-gradient-to-br ${meta.gradient}`}
      aria-hidden="true"
    >
      {/* faux page stack */}
      <div className="absolute right-4 top-4 h-20 w-16 rotate-6 rounded-md bg-white/15 shadow-lg ring-1 ring-white/30 backdrop-blur-sm" />
      <div className="absolute right-7 top-6 h-20 w-16 -rotate-3 rounded-md bg-white/90 shadow-xl ring-1 ring-white/60">
        <div className="mx-2 mt-2 h-1.5 rounded-full bg-[#02459c]/70" />
        <div className="mx-2 mt-1.5 h-1 rounded-full bg-[#02459c]/40" />
        <div className="mx-2 mt-1.5 h-1 w-8 rounded-full bg-[#ff6f00]/80" />
        <div className="mx-2 mt-2 h-6 rounded-sm bg-gradient-to-br from-[#02459c]/20 to-[#ff6f00]/20" />
      </div>
      <div className="absolute left-4 bottom-3 flex items-center gap-2 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur ring-1 ring-white/40">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider drop-shadow">
          {meta.label}
        </span>
      </div>
    </div>
  );
}

function ShareRow({ r }: { r: DownloadResource }) {
  const [copied, setCopied] = useState(false);
  const url = fileUrl(r);
  const text = `${r.title} — ${r.description}`;

  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const whatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`;
  const email = `mailto:?subject=${encodeURIComponent(r.title)}&body=${encodeURIComponent(`${r.description}\n\n${url}`)}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const iconBtn =
    "inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border/60 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <a
        href={linkedin}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        title="Share on LinkedIn"
        className={`${iconBtn} bg-[#0A66C2] text-white hover:bg-[#004182] focus-visible:ring-[#0A66C2]`}
      >
        <Linkedin className="h-4 w-4" />
      </a>
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        title="Share on WhatsApp"
        className={`${iconBtn} bg-[#25D366] text-white hover:bg-[#1da851] focus-visible:ring-[#25D366]`}
      >
        <MessageCircle className="h-4 w-4" />
      </a>
      <a
        href={email}
        aria-label="Share via email"
        title="Share via email"
        className={`${iconBtn} bg-[#ff6f00] text-white hover:bg-[#e66300] focus-visible:ring-[#ff6f00]`}
      >
        <Mail className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy link"
        title="Copy link"
        className={`${iconBtn} bg-card text-foreground hover:bg-muted focus-visible:ring-primary`}
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function DownloadResources() {
  return (
    <section id="download-resources" className="mt-10 scroll-mt-20">
      <h2 className="mb-3 text-lg font-bold text-[#ff6f00]">Download Resources</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Free PDFs and carousels. Download or share with your network in one tap.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {downloadResources.map((r) => (
          <Card
            key={r.id}
            className="group overflow-hidden border-2 border-[#02459c]/20 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-[#02459c]/60 hover:shadow-elegant"
          >
            <PreviewHeader r={r} />
            <CardContent className="space-y-3 p-4">
              <div className="space-y-1.5">
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                  {r.category}
                </Badge>
                <h3 className="text-sm font-bold leading-tight text-foreground">{r.title}</h3>
                <p className="line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
              </div>
              <Button
                asChild
                size="sm"
                className="h-9 w-full bg-gradient-to-r from-[#ff6f00] to-[#ff8c1a] font-bold text-white shadow-soft hover:from-[#e66300] hover:to-[#ff6f00]"
              >
                <a href={fileUrl(r)} target="_blank" rel="noopener noreferrer" download>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
                </a>
              </Button>
              <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Share
                </span>
                <ShareRow r={r} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
