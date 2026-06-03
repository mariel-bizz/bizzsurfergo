import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Linkedin, MessageCircle, Mail, Link2, Check, FileText, Presentation } from "lucide-react";
import { downloadResources, SITE_ORIGIN, type DownloadResource } from "@/lib/insights-media";
import { SectionHeader } from "@/components/SectionHeader";
import { toast } from "sonner";

// Always use the production custom domain for downloads & previews so the
// preview/sandbox host (which gates with a Lovable sign-in) is never hit.
function fileUrl(r: DownloadResource) {
  return `${SITE_ORIGIN}${r.file}`;
}

function shareUrl(r: DownloadResource) {
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
      className={`relative h-40 w-full overflow-hidden bg-gradient-to-br ${meta.gradient}`}
      aria-hidden="true"
    >
      {/* Embedded PDF first-page preview, same-origin so no auth gate. */}
      <object
        data={`${fileUrl(r)}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
        type="application/pdf"
        className="absolute inset-0 h-full w-full opacity-90"
        aria-hidden="true"
      >
        {/* Fallback faux page stack */}
        <div className="absolute right-5 top-5 h-24 w-20 rotate-6 rounded-md bg-white/15 shadow-lg ring-1 ring-white/30 backdrop-blur-sm" />
        <div className="absolute right-8 top-7 h-24 w-20 -rotate-3 rounded-md bg-white/95 shadow-xl ring-1 ring-white/60">
          <div className="mx-2 mt-2 h-1.5 rounded-full bg-[#02459c]/70" />
          <div className="mx-2 mt-1.5 h-1 rounded-full bg-[#02459c]/40" />
          <div className="mx-2 mt-1.5 h-1 w-10 rounded-full bg-[#ff6f00]/80" />
          <div className="mx-2 mt-2 h-8 rounded-sm bg-gradient-to-br from-[#02459c]/20 to-[#ff6f00]/20" />
        </div>
      </object>
      {/* Gradient overlay to keep the badge legible over any preview */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      <div className="absolute left-3 bottom-3 flex items-center gap-2 text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/25 backdrop-blur ring-1 ring-white/40">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider drop-shadow">
          {meta.label}
        </span>
      </div>
    </div>
  );
}

function ShareRow({ r }: { r: DownloadResource }) {
  const [copied, setCopied] = useState(false);
  const url = shareUrl(r);
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

  const pill =
    "group/btn relative inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <a
        href={linkedin}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className={`${pill} bg-gradient-to-br from-[#0A66C2] to-[#004182] focus-visible:ring-[#0A66C2]`}
      >
        <Linkedin className="h-3.5 w-3.5" />
        <span>In</span>
      </a>
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className={`${pill} bg-gradient-to-br from-[#25D366] to-[#128C7E] focus-visible:ring-[#25D366]`}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        <span>WA</span>
      </a>
      <a
        href={email}
        aria-label="Share via email"
        className={`${pill} bg-gradient-to-br from-[#ff6f00] to-[#e64a00] focus-visible:ring-[#ff6f00]`}
      >
        <Mail className="h-3.5 w-3.5" />
        <span>Email</span>
      </a>
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy link"
        className={`${pill} bg-gradient-to-br from-slate-700 to-slate-900 focus-visible:ring-slate-500`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

export function DownloadResources() {
  return (
    <section id="download-resources" className="mt-10 scroll-mt-20">
      <SectionHeader className="mb-3">Download Resources</SectionHeader>
      <p className="mb-4 text-sm text-muted-foreground">
        Free PDFs and carousels. Download or share with your network in one tap.
      </p>
      <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:gap-5">
        {downloadResources.map((r) => (
          <Card
            key={r.id}
            className="group flex flex-col overflow-hidden border-2 border-[#02459c]/20 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-[#02459c]/60 hover:shadow-elegant"
          >
            <PreviewHeader r={r} />
            <CardContent className="flex flex-1 flex-col gap-3 p-4">
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
                className="mt-auto h-9 w-full bg-gradient-to-r from-[#ff6f00] to-[#ff8c1a] font-bold text-white shadow-soft hover:from-[#e66300] hover:to-[#ff6f00]"
              >
                <a href={fileUrl(r)} target="_blank" rel="noopener noreferrer" download>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
                </a>
              </Button>
              <div className="border-t border-border/50 pt-3">
                <ShareRow r={r} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
