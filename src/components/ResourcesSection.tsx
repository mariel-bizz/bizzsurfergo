import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  BookOpen, Briefcase, Download, FileText, Globe, Headphones, Linkedin, MessageCircle, Music, Plug, Twitter, Youtube,
} from "lucide-react";

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

const resources = [
  { icon: BookOpen, title: "Blog & Resources", desc: "Playbooks, frameworks & insights for transformation leaders.", href: "/insights", internal: true },
  { icon: FileText, title: "Market Trends Report", desc: "Download the latest Agentic AI benchmarking study.", href: "https://www.bizzsurfer.com/reports", download: true },
  { icon: Headphones, title: "Podcast", desc: "Conversations with operators behind enterprise AI.", href: "/podcast", internal: true },
  { icon: Briefcase, title: "Careers", desc: "Help us build the agentic future. We're hiring.", href: "https://www.bizzsurfer.com/careers" },
];

const socials = [
  { icon: Globe, label: "bizzsurfer.com", href: "https://bizzsurfer.com" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/company/bizzsurfer" },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com/@bizzsurfer" },
  { icon: Twitter, label: "Twitter", href: "https://twitter.com/bizzsurfer" },
  { icon: Music, label: "Spotify", href: "https://open.spotify.com/user/31l6phq64rtvbtqbgeyozhlbpyly" },
  { icon: MessageCircle, label: "WhatsApp", href: "https://wa.me/31614630463" },
];

export function ResourcesSection() {
  return (
    <section className="px-5 space-y-5">
      {/* Resources grid */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-3">Explore & download</h2>
        <div className="grid grid-cols-2 gap-3">
          {resources.map((r) => {
            const inner = (
              <>
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
              </>
            );
            const className =
              "rounded-2xl bg-card border border-border p-4 shadow-card flex flex-col gap-2 active:scale-[0.98] transition-transform";
            return r.internal ? (
              <Link key={r.title} to={r.href} className={className}>
                {inner}
              </Link>
            ) : (
              <a
                key={r.title}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {inner}
              </a>
            );
          })}
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

    </section>
  );
}

const socialStyles: Record<string, { bg: string; label: string; sub: string }> = {
  "bizzsurfer.com": {
    bg: "bg-[linear-gradient(135deg,oklch(0.55_0.20_265),oklch(0.65_0.18_220))]",
    label: "Website",
    sub: "bizzsurfer.com",
  },
  LinkedIn: {
    bg: "bg-[linear-gradient(135deg,oklch(0.45_0.15_245),oklch(0.55_0.18_240))]",
    label: "LinkedIn",
    sub: "@bizzsurfer",
  },
  YouTube: {
    bg: "bg-[linear-gradient(135deg,oklch(0.55_0.24_25),oklch(0.62_0.22_15))]",
    label: "YouTube",
    sub: "@bizzsurfer",
  },
  Twitter: {
    bg: "bg-[linear-gradient(135deg,oklch(0.55_0.18_230),oklch(0.65_0.16_220))]",
    label: "Twitter",
    sub: "@bizzsurfer",
  },
  Spotify: {
    bg: "bg-[linear-gradient(135deg,oklch(0.65_0.20_145),oklch(0.55_0.22_150))]",
    label: "Spotify",
    sub: "BizzSurfer",
  },
  WhatsApp: {
    bg: "bg-[linear-gradient(135deg,oklch(0.65_0.18_150),oklch(0.55_0.20_155))]",
    label: "WhatsApp",
    sub: "+31 6 14630463",
  },
};

export function FollowSection() {
  return (
    <section className="px-5">
      <div className="rounded-3xl bg-card border border-border p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Follow BizzSurfer</p>
            <h2 className="text-lg font-bold text-foreground mt-1">Stay in the loop</h2>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {socials.map((s) => {
            const style = socialStyles[s.label] ?? socialStyles["bizzsurfer.com"];
            return (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Follow BizzSurfer on ${style.label}`}
                className={`relative overflow-hidden rounded-2xl ${style.bg} p-3 text-white shadow-elegant active:scale-95 transition-transform flex flex-col items-start gap-2 min-h-[110px]`}
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/15 blur-xl" />
                <div className="absolute -bottom-8 -left-4 w-16 h-16 rounded-full bg-white/10 blur-lg" />
                <div className="relative w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-white fill-white/30" />
                </div>
                <div className="relative mt-auto">
                  <p className="text-[13px] font-bold leading-tight">{style.label}</p>
                  <p className="text-[10px] opacity-90 leading-tight">{style.sub}</p>
                </div>
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
      <div className="rounded-2xl border border-border p-5 bg-transparent">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
          BizzSurfer GO! is powered by
        </p>
        <div className="mt-4 grid grid-cols-3 gap-4 items-center">
          {poweredBy.map((p) => (
            <div
              key={p.name}
              title={p.name}
              className="flex h-16 items-center justify-center bg-transparent px-2"
            >
              <img
                src={p.src}
                alt={`${p.name} logo`}
                loading="lazy"
                decoding="async"
                className="max-h-12 max-w-full object-contain"
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
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Trusted partners</p>
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
