import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BookOpen, Briefcase, Download, FileText, Globe, Headphones, Linkedin, Plug, Youtube,
} from "lucide-react";

const partners = ["NVIDIA Inception", "Atlassian", "GitLab", "AWS"];

const resources = [
  { icon: BookOpen, title: "Blog & Resources", desc: "Playbooks, frameworks & insights for transformation leaders.", href: "https://www.bizzsurfer.com/blog" },
  { icon: FileText, title: "Market Trends Report", desc: "Download the latest Agentic AI benchmarking study.", href: "https://www.bizzsurfer.com/reports", download: true },
  { icon: Headphones, title: "Podcast", desc: "Conversations with operators behind enterprise AI.", href: "https://www.bizzsurfer.com/podcast" },
  { icon: Briefcase, title: "Careers", desc: "Help us build the agentic future. We're hiring.", href: "https://www.bizzsurfer.com/careers" },
];

const socials = [
  { icon: Globe, label: "bizzsurfer.com", href: "https://www.bizzsurfer.com" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/company/bizzsurfer" },
  { icon: Youtube, label: "YouTube", href: "https://www.youtube.com/@bizzsurfer" },
];

export function ResourcesSection() {
  return (
    <section className="px-5 space-y-5">
      {/* Partners */}
      <div className="rounded-2xl bg-card border border-border p-5 shadow-card">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Trusted partners</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {partners.map((p) => (
            <span key={p} className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground">
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Resources grid */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-3">Explore & download</h2>
        <div className="grid grid-cols-2 gap-3">
          {resources.map((r) => (
            <a
              key={r.title}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-card border border-border p-4 shadow-card flex flex-col gap-2 active:scale-[0.98] transition-transform"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
                <r.icon className="w-4 h-4 text-primary-foreground" />
              </div>
              <h3 className="text-sm font-bold text-foreground leading-tight">{r.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-snug">{r.desc}</p>
              {r.download && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary mt-auto">
                  <Download className="w-3 h-3" /> Download
                </span>
              )}
            </a>
          ))}
        </div>
      </div>

      {/* Connect APIs */}
      <div className="rounded-2xl bg-gradient-primary p-5 text-primary-foreground shadow-elegant">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            <Plug className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold">Connect your APIs & Tools</h3>
            <p className="text-xs opacity-95 mt-1">Plug in ERP, CRM, HRIS, BI and SaaS tools — let agents orchestrate across them.</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="mt-4 w-full bg-white text-primary hover:bg-white/90 font-bold"
          onClick={() => toast.info("Integrations launching with the Agentic AI release. Join the waitlist to get early access.")}
        >
          Browse integrations
        </Button>
      </div>

      {/* Socials */}
      <div className="rounded-2xl bg-card border border-border p-4 shadow-card">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Follow BizzSurfer</p>
        <div className="grid grid-cols-3 gap-2">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background py-3 active:scale-95 transition-transform"
            >
              <s.icon className="w-4 h-4 text-primary" />
              <span className="text-[11px] font-semibold text-foreground">{s.label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
