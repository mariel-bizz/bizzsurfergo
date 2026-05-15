import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/SectionHeader";
import { Link } from "@tanstack/react-router";

import {
  BookOpen, Briefcase, Download, FileText, Globe, Headphones, Linkedin, Music, Plug, Twitter, Youtube,
} from "lucide-react";

import podcastCover from "@/assets/podcast-card-v5.png";
import apolloLogo from "@/assets/partners/apollo.png";
import hubspotLogo from "@/assets/partners/hubspot.png";
import devrevLogo from "@/assets/partners/devrev.png";
import atlassianLogo from "@/assets/partners/atlassian.png";
import zendeskLogo from "@/assets/partners/zendesk.png";
import amplitudeLogo from "@/assets/partners/amplitude.png";
import lambdaLogo from "@/assets/partners/lambda.png";
import miroLogo from "@/assets/partners/miro.png";
import bubbleLogo from "@/assets/partners/bubble.png";
import salesforceLogo from "@/assets/partners/salesforce.png";
import porterLogo from "@/assets/partners/porter.png";
import intercomLogo from "@/assets/partners/intercom.png";
import cloudflareLogo from "@/assets/partners/cloudflare.png";
import databricksLogo from "@/assets/partners/databricks.png";
import mongodbLogo from "@/assets/partners/mongodb.png";
import datadogLogo from "@/assets/partners/datadog.png";
import loomLogo from "@/assets/partners/loom.png";
import deelLogo from "@/assets/partners/deel.png";
import confluentLogo from "@/assets/partners/confluent.png";
import auth0Logo from "@/assets/partners/auth0.png";
import nebiusLogo from "@/assets/partners/nebius.png";
import azureLogo from "@/assets/partners/azure.png";
import gitlabLogo from "@/assets/partners/gitlab.png";
import scalewayLogo from "@/assets/partners/scaleway.png";
import notionLogo from "@/assets/partners/notion.png";

const partners: { name: string; src: string }[] = [
  { name: "Apollo.io", src: apolloLogo },
  { name: "HubSpot", src: hubspotLogo },
  { name: "DevRev", src: devrevLogo },
  { name: "Atlassian", src: atlassianLogo },
  { name: "Zendesk", src: zendeskLogo },
  { name: "Amplitude", src: amplitudeLogo },
  { name: "Lambda", src: lambdaLogo },
  { name: "Miro", src: miroLogo },
  { name: "Bubble", src: bubbleLogo },
  { name: "Salesforce", src: salesforceLogo },
  { name: "Porter", src: porterLogo },
  { name: "Intercom", src: intercomLogo },
  { name: "Cloudflare", src: cloudflareLogo },
  { name: "Databricks", src: databricksLogo },
  { name: "MongoDB", src: mongodbLogo },
  { name: "Datadog", src: datadogLogo },
  { name: "Loom", src: loomLogo },
  { name: "Deel", src: deelLogo },
  { name: "Confluent", src: confluentLogo },
  { name: "Auth0", src: auth0Logo },
  { name: "Nebius", src: nebiusLogo },
  { name: "Microsoft Azure", src: azureLogo },
  { name: "GitLab", src: gitlabLogo },
  { name: "Scaleway", src: scalewayLogo },
  { name: "Notion", src: notionLogo },
];

type Resource = {
  icon: typeof BookOpen;
  title: string;
  desc: string;
  href: string;
  internal?: boolean;
  download?: boolean;
  cta: string;
  image?: string;
  imageAlt?: string;
};

const resources: Resource[] = [
  { icon: BookOpen, title: "Blog & Resources", desc: "Playbooks, frameworks & insights for transformation leaders.", href: "/insights", internal: true, cta: "Read insights" },
  { icon: FileText, title: "Market Trends Report", desc: "Download the latest Agentic AI benchmarking study.", href: "https://www.bizzsurfer.com/reports", download: true, cta: "Download report" },
  {
    icon: Headphones,
    title: "Podcast",
    desc: "Changing the Status Quo with Agentic AI — with Mariel Schaab, CEO & Founder of BizzSurfer.",
    href: "/podcast",
    internal: true,
    cta: "Listen now",
    image: podcastCover,
    imageAlt: "Agentic AI Intelligence for Business Transformation — podcast cover with Mariel Schaab",
  },
];

const careers: Resource = {
  icon: Briefcase,
  title: "Careers at BizzSurfer",
  desc: "Join Our BizzSurfer Team! building autonomous workflows for enterprise transformation.",
  href: "/careers",
  internal: true,
  cta: "See open roles",
};

type Social = { icon: typeof Globe; label: string; href: string; color: string };

const socials: Social[] = [
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/company/bizzsurfer", color: "#0A66C2" },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com/@bizzsurfer", color: "#FF0000" },
  { icon: Music, label: "Spotify", href: "https://open.spotify.com/user/31l6phq64rtvbtqbgeyozhlbpyly", color: "#1DB954" },
  { icon: Globe, label: "Website", href: "https://bizzsurfer.com", color: "#3B82F6" },
  { icon: Headphones, label: "Podcast", href: "/podcast", color: "#8B5CF6" },
  { icon: Twitter, label: "Twitter", href: "https://twitter.com/bizzsurfer", color: "#1DA1F2" },
];

import { ArrowRight } from "lucide-react";

function ResourceTile({ r }: { r: Resource }) {
  const inner = (
    <>
      <div className="w-11 h-11 rounded-2xl bg-gradient-agentic flex items-center justify-center shrink-0 shadow-soft">
        <r.icon className="w-5 h-5 text-white" strokeWidth={2.25} />
      </div>
      <h3 className="text-sm font-bold text-foreground leading-tight">{r.title}</h3>
      <p className="text-[11px] text-muted-foreground leading-snug">{r.desc}</p>
      <span className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-agentic text-white text-[11px] font-bold px-3 py-2 shadow-soft transition-transform group-hover:scale-[1.02] group-active:scale-[0.98]">
        {r.download ? <Download className="w-3 h-3" /> : null}
        {r.cta}
        {!r.download ? <ArrowRight className="w-3 h-3" /> : null}
      </span>
    </>
  );
  const className =
    "group rounded-3xl bg-card border-2 border-[#02459c] p-4 shadow-card flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elegant hover:border-[#0357c2] focus-visible:outline-none focus-visible:-translate-y-0.5 focus-visible:shadow-elegant focus-visible:ring-2 focus-visible:ring-[#02459c]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]";
  return r.internal ? (
    <Link to={r.href} className={className}>
      {inner}
    </Link>
  ) : (
    <a href={r.href} target="_blank" rel="noopener noreferrer" className={className}>
      {inner}
    </a>
  );
}

export function ResourcesSection() {
  return (
    <section className="px-5 space-y-5">
      <div>
        <SectionHeader className="mb-3">Explore & Download</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          {resources.map((r) => (
            <ResourceTile key={r.title} r={r} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function CareersSection() {
  return (
    <section className="px-5">
      <SectionHeader className="mb-3">Careers</SectionHeader>
      <ResourceTile r={careers} />
    </section>
  );
}

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePremium } from "@/hooks/usePremium";
import { UpgradeToPremiumDialog } from "@/components/UpgradeToPremiumDialog";

export function ConnectApisSection() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isPremium, loading } = usePremium();

  const handleClick = () => {
    if (loading) return;
    if (isPremium) {
      navigate({ to: "/integrations" });
    } else {
      setOpen(true);
    }
  };

  return (
    <section className="px-5">
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
          onClick={handleClick}
          disabled={loading}
        >
          Browse integrations
        </Button>
      </div>

      <UpgradeToPremiumDialog open={open} onOpenChange={setOpen} />
    </section>
  );
}

export function FollowSection() {
  return (
    <section className="px-5">
      <SectionHeader className="mb-4">Follow BizzSurfer</SectionHeader>
      <div className="rounded-3xl bg-card border border-border p-5 shadow-card">
        <div className="grid grid-cols-3 gap-x-3 gap-y-4 justify-items-center">
          {socials.map((s) => {
            const Icon = s.icon;
            const isInternal = s.href.startsWith("/");
            const content = (
              <>
                <span
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-card transition-transform group-hover:scale-105 group-active:scale-95"
                  style={{ backgroundColor: s.color }}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.25} />
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">{s.label}</span>
              </>
            );
            const className = "group flex flex-col items-center gap-1.5";
            return isInternal ? (
              <Link key={s.label} to={s.href} aria-label={`BizzSurfer ${s.label}`} className={className}>
                {content}
              </Link>
            ) : (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Follow BizzSurfer on ${s.label}`}
                className={className}
              >
                {content}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import nvidiaInception from "@/assets/powered-by/nvidia-inception.png";
import awsActivate from "@/assets/powered-by/aws-activate.png";
import googleForStartups from "@/assets/powered-by/google-for-startups.png";

const poweredBy: { name: string; src: string }[] = [
  { name: "NVIDIA Inception Program", src: nvidiaInception },
  { name: "AWS Activate", src: awsActivate },
  { name: "Google for Startups", src: googleForStartups },
];

export function PoweredBySection() {
  return (
    <section className="px-5">
      <div
        tabIndex={0}
        className="rounded-xl border-border p-3 bg-transparent border-4 border-[#ffad1f] transition-all duration-300 hover:shadow-[0_0_0_4px_rgba(255,173,31,0.18),0_8px_24px_-8px_rgba(255,173,31,0.45)] hover:border-[#ff8c00] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(255,173,31,0.25),0_8px_24px_-8px_rgba(255,173,31,0.5)] focus-visible:border-[#ff8c00]"
      >
        <p className="uppercase tracking-widest text-muted-foreground font-semibold text-center text-sm text-[#02459c]">
          BizzSurfer GO! is powered by
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2 items-center">
          {poweredBy.map((p) => (
            <div
              key={p.name}
              title={p.name}
              className="flex h-10 items-center justify-center bg-transparent px-1"
            >
              <img
                src={p.src}
                alt={`${p.name} logo`}
                loading="lazy"
                decoding="async"
                className="max-h-8 max-w-full object-contain opacity-90"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrustedPartnersSection() {
  return (
    <section className="px-5">
      <div className="rounded-2xl border border-border p-5 bg-transparent">
        <p className="font-bold whitespace-nowrap text-[#f33939] uppercase tracking-widest text-center text-sm">Trusted partners</p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {partners.map((p) => (
            <div
              key={p.name}
              title={p.name}
              className="flex h-14 items-center justify-center bg-transparent px-2"
            >
              <img
                src={p.src}
                alt={`${p.name} logo`}
                loading="lazy"
                decoding="async"
                className="max-h-8 max-w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
