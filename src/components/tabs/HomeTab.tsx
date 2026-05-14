import { useGame } from "../AppShell";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Network, Users, Target, AlertTriangle, ChevronDown, Trophy, Rocket, Bot, Headphones } from "lucide-react";
import { useState } from "react";

import { WaitlistDialog } from "../WaitlistDialog";
import { ROICalculator } from "../ROICalculator";
import { ResourcesSection, TrustedPartnersSection, PoweredBySection, FollowSection, ConnectApisSection } from "../ResourcesSection";
import { PainTracker, type PainItem } from "../PainTracker";
import podcastCover from "@/assets/podcast-card-v5.png";
import eventAgenticVsAgents from "@/assets/event-agentic-ai-vs-ai-agents.png";
import { pastEvents, eventLink } from "@/lib/events-data";

const painPoints: PainItem[] = [
  { key: "execution", icon: Target, title: "Stalled transformation execution", desc: "Strategy decks land. Execution doesn't. Initiatives drift across silos with no shared signal." },
  { key: "systems", icon: Network, title: "Disconnected enterprise systems", desc: "ERP, HRIS, CRM, BI — each a fortress. Decisions wait on data that never arrives." },
  { key: "fatigue", icon: Users, title: "Change fatigue at every level", desc: "Leaders push. Middle management resists. Frontline disengages. Adoption stalls below 40%." },
  { key: "agents", icon: AlertTriangle, title: "AI agents that just don't decide", desc: "Most copilots wait for prompts. You need autonomous agents that orchestrate outcomes." },
];

const faqs = [
  { q: "What's the difference between Agentic AI and AI agents?", a: "AI agents handle specific tasks under human direction. Agentic AI is designed to act more autonomously, coordinating decisions and actions across connected systems." },
  { q: "How fast can we deploy BizzSurfer in our enterprise?", a: "Timelines depend on which systems are connected and the scope of the rollout. Workflows can be introduced incrementally rather than as a single large programme." },
  { q: "Is it secure for regulated industries?", a: "BizzSurfer is built with role-based access, audit logging, and support for private deployments, so it can fit within governed enterprise environments." },
  { q: "Will it replace our transformation team?", a: "No. BizzSurfer is built to support transformation teams — people stay in control of decisions while agents help with coordination and execution work." },
  { q: "What ROI should leaders expect?", a: "Outcomes vary by organisation and use case. The platform is designed to shorten execution cycles, speed up decisions, and improve adoption of change initiatives." },
];

export function HomeTab() {
  const game = useGame();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [waitOpen, setWaitOpen] = useState(false);

  return (
    <div className="space-y-8 pt-2">
      {/* Hero */}
      <section className="relative px-5 pt-6 pb-8 wave-bg overflow-hidden">
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
            <Sparkles className="w-3 h-3" /> For Transformation Leaders
          </span>
          <h1 className="mt-4 text-[28px] leading-[1.1] font-bold text-foreground text-balance">
            Agentic AI Intelligence for <span className="text-primary italic">Business Transformation</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Connect your enterprise systems. Let Agentic AI orchestrate decisions, adoption and execution — at the speed of the boardroom.
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95 h-12 text-sm font-bold" onClick={() => navigate({ to: "/chat" })}>
              Talk to BizzSurfer Go! <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 text-sm font-semibold" onClick={() => setWaitOpen(true)}>
              Join the Agentic AI launch waitlist
            </Button>
          </div>
        </div>
      </section>

      {/* Podcast promo — above Reality Check */}
      <section className="px-5">
        <Link
          to="/insights"
          className="group block rounded-3xl overflow-hidden bg-gradient-deep text-white shadow-elegant border border-white/10 hover:shadow-soft transition"
        >
          <div className="flex items-stretch">
            <div className="relative w-32 sm:w-40 shrink-0 bg-black/30">
              <img
                src={podcastCover}
                alt="Agentic AI Intelligence for Business Transformation — podcast cover with Mariel Schaab"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/95 group-hover:text-white font-extrabold object-fill my-[10px]"
                loading="lazy"
              />
            </div>
            <div className="flex-1 p-4 sm:p-5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                  <Headphones className="w-3 h-3" /> PODCAST & WEBINAR
                </span>
              </div>
              <h2 className="mt-2 text-base sm:text-lg font-bold leading-tight">
                Changing the Status Quo with Agentic AI for Business Transformation
              </h2>
              <p className="mt-1 text-xs opacity-90 line-clamp-2">
                With Mariel Schaab, CEO &amp; Founder of BizzSurfer. New episodes weekly.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/95 group-hover:text-white font-extrabold">
                Listen now <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Last event — rewatch, above ROI */}
      {pastEvents[0] && (
        <section className="px-5">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="flex items-center gap-3 text-[#ff6f00] font-bold">Rewatch our Last Event! </h2>
            <span className="h-px flex-1 bg-border" />
          </div>
          <a
            href={eventLink(pastEvents[0])}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-[#0a66c2]/10 via-card to-card hover:border-[#0a66c2]/50 transition-colors shadow-card"
          >
            <div className="relative overflow-hidden">
              <img
                src={eventAgenticVsAgents}
                alt={pastEvents[0].title}
                className="w-full h-auto block"
                loading="lazy"
              />
              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Replay
              </span>
            </div>
            <div className="p-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0a66c2]">LinkedIn Event</p>
                <p className="text-sm font-bold text-foreground truncate">{pastEvents[0].title}</p>
                <p className="text-xs text-muted-foreground truncate">{pastEvents[0].date} · {pastEvents[0].location}</p>
              </div>
              <span className="text-xs font-semibold text-[#0a66c2] group-hover:underline shrink-0">
                Rewatch →
              </span>
            </div>
          </a>
        </section>
      )}

      {/* ROI Calculator — above Reality Check */}
      <section className="px-5">
        <ROICalculator />
      </section>

      {/* Powered by — compact, under ROI */}
      <PoweredBySection />

      {/* Pain points */}
      <section className="relative px-5 py-8 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-16 -left-10 w-56 h-56 rounded-full bg-primary/15 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 -right-10 w-56 h-56 rounded-full bg-accent/30 blur-3xl animate-pulse [animation-delay:1.5s]" />
        </div>

        <div className="mb-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-destructive">
            <AlertTriangle className="w-3 h-3" /> Reality check
          </span>
          <h2 className="mt-3 text-2xl font-bold text-foreground leading-tight">
            Your pain points you <span className="italic text-primary relative">
              feel
              <svg className="absolute left-0 -bottom-1 w-full" height="6" viewBox="0 0 120 6" preserveAspectRatio="none" aria-hidden="true">
                <path d="M2 4 Q 30 0, 60 3 T 118 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </span> !
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">Toggle what hurts and slide the intensity — we'll surface your top pain and prep a chat prompt.</p>
        </div>

        <PainTracker items={painPoints} />
      </section>

      {/* Explore & download — under Reality Check */}
      <ResourcesSection />

      {/* Gamification card */}
      <section className="px-5">
        <div className="rounded-2xl bg-gradient-deep p-5 text-primary-foreground shadow-elegant relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-widest opacity-80 font-semibold">Executive Surfer</p>
              <p className="text-lg font-bold">Level {Math.floor(game.state.xp / 100) + 1}</p>
            </div>
            <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur" onClick={() => navigate({ to: "/profile" })}>
              View
            </Button>
          </div>
          <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/10 backdrop-blur py-2">
              <p className="text-lg font-bold">{game.state.xp}</p>
              <p className="text-[10px] opacity-80 uppercase tracking-wider">XP</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur py-2">
              <p className="text-lg font-bold">{game.state.streak}🔥</p>
              <p className="text-[10px] opacity-80 uppercase tracking-wider">Streak</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur py-2">
              <p className="text-lg font-bold">{game.state.badges.length}</p>
              <p className="text-[10px] opacity-80 uppercase tracking-wider">Badges</p>
            </div>
          </div>
        </div>
      </section>

      {/* Go Agentic! */}
      <section className="px-5">
        <Link to="/marketplace" className="block rounded-3xl bg-card border border-border shadow-card p-5 hover:border-primary/40 hover:shadow-soft transition">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Go Agentic!</p>
              <h3 className="text-base font-bold text-foreground">Agents, services & playbooks</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Curated tools to accelerate your transformation.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-primary shrink-0" />
          </div>
        </Link>
      </section>

      {/* Social media */}
      <FollowSection />

      {/* FAQs */}
      <section className="px-5">
        <h2 className="text-xl font-bold text-foreground mb-4">Frequently asked at the C-suite</h2>
        <div className="space-y-2">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <button
                key={i}
                onClick={() => setOpenFaq(open ? null : i)}
                className="w-full text-left rounded-2xl bg-card border border-border p-4 shadow-card transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-foreground">{f.q}</h3>
                  <ChevronDown className={`shrink-0 w-4 h-4 text-primary transition-transform ${open ? "rotate-180" : ""}`} />
                </div>
                {open && <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{f.a}</p>}
              </button>
            );
          })}
        </div>
      </section>

      {/* CTA waitlist */}
      <section className="px-5">
        <div className="relative rounded-3xl p-6 bg-gradient-primary text-primary-foreground shadow-elegant overflow-hidden">
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
          <Rocket className="w-7 h-7 mb-3" />
          <h2 className="text-2xl font-bold leading-tight">BizzSurfer Agentic AI is launching soon</h2>
          <p className="mt-2 text-sm opacity-95">Be among the first executives to orchestrate transformation with autonomous agents.</p>
          <Button size="lg" variant="secondary" className="mt-5 w-full bg-white text-primary hover:bg-white/90 h-12 font-bold" onClick={() => setWaitOpen(true)}>
            Join the waitlist
          </Button>
        </div>
      </section>

      {/* FollowSection moved up under ROI */}

      <TrustedPartnersSection />

      <ConnectApisSection />

      <WaitlistDialog open={waitOpen} onOpenChange={setWaitOpen} onJoined={() => {
        game.update((s) => {
          const badges = s.badges.includes("Early Adopter") ? s.badges : [...s.badges, "Early Adopter"];
          return { ...s, xp: s.xp + 50, badges };
        });
      }} />
    </div>
  );
}
