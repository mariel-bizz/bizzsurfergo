import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Linkedin, MessageCircle, Mail, Link2, Check, FileText } from "lucide-react";
import { downloadResources, SITE_ORIGIN, type DownloadResource } from "@/lib/insights-media";
import { toast } from "sonner";

function shareUrl(r: DownloadResource) {
  return `${SITE_ORIGIN}${r.file}`;
}

function ShareRow({ r }: { r: DownloadResource }) {
  const [copied, setCopied] = useState(false);
  const url = shareUrl(r);
  const text = `${r.title} — ${r.description}`;

  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
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

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button asChild size="sm" variant="outline" className="h-8 px-2.5">
        <a href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
          <Linkedin className="h-3.5 w-3.5" />
        </a>
      </Button>
      <Button asChild size="sm" variant="outline" className="h-8 px-2.5">
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">
          <MessageCircle className="h-3.5 w-3.5" />
        </a>
      </Button>
      <Button asChild size="sm" variant="outline" className="h-8 px-2.5">
        <a href={email} aria-label="Share via email">
          <Mail className="h-3.5 w-3.5" />
        </a>
      </Button>
      <Button size="sm" variant="outline" className="h-8 px-2.5" onClick={onCopy} aria-label="Copy link">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
      </Button>
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
      <div className="grid gap-3 sm:grid-cols-2">
        {downloadResources.map((r) => (
          <Card key={r.id} className="overflow-hidden">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <Badge variant="secondary" className="mb-1 text-[10px] uppercase tracking-wide">
                    {r.category}
                  </Badge>
                  <h3 className="text-sm font-bold leading-tight text-foreground">{r.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button asChild size="sm" className="h-8">
                  <a href={r.file} download>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
                  </a>
                </Button>
                <ShareRow r={r} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
