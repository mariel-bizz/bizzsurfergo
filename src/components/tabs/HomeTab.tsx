import { useGame } from "../AppShell";
import { SectionHeader } from "@/components/SectionHeader";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Network, Users, Target, AlertTriangle, ChevronDown, Trophy, Rocket, Bot } from "lucide-react";
import { useState } from "react";

import { WaitlistDialog } from "../WaitlistDialog";
import { ROICalculator } from "../ROICalculator";
import { ResourcesSection, TrustedPartnersSection, PoweredBySection, FollowSection, ConnectApisSection, CareersSection } from "../ResourcesSection";
import { OnboardingChecklist } from "../OnboardingChecklist";
import { PainTracker, type PainItem } from "../PainTracker";
import { FeaturedVideoHome } from "../insights/VideoContent";
import { EventQuotaWidget } from "../events/EventQuotaWidget";

import eventAgenticVsAgents from "@/assets/event-agentic-ai-vs-ai-agents.png";
import { pastEvents, eventLink } from "@/lib/events-data";

const painPoints: PainItem[] = [
  { key: "execution", icon: Target, title: "Stalled transformation execution", desc: "Strategy decks land. Execution doesn't. Initiatives drift across silos with no shared signal." },
  { key: "systems", icon: Network, title: "Disconnected enterprise systems", desc: "ERP, HRIS, CRM, BI — each a fortress. Decisions wait on data that never arrives." },
  { key: "fatigue", icon: Users, title: "Change fatigue at every level", desc: "Leaders push. Middle management resists. Frontline disengages. Adoption stalls below 40%." },
  { key: "agents", icon: AlertTriangle, title: "AI agents that just don't decide", desc: "Most copilots wait for prompts. You need autonomous agents that orchestrate outcomes." },
];

const faqs = [
  {
    q: "What's the difference between Agentic AI and AI agents?",
    a: "AI agents are narrow assistants that wait for prompts and execute a single task — drafting an email, summarising a report, querying a database. Agentic AI is the orchestration layer above them: it sets goals, sequences multiple agents and tools, monitors outcomes, and adapts in real time across enterprise systems (ERP, CRM, HRIS, BI). Think of AI agents as workers and Agentic AI as the autonomous manager coordinating them toward measurable business outcomes.",
  },
  {
    q: "How fast can we deploy BizzSurfer Agentic AI in our enterprise?",
    a: "Most transformation teams ship their first orchestrated workflow in 2–6 weeks. We deploy incrementally — start with one high-value use case (finance close, sales handover, onboarding), connect 2–3 systems, then expand. A typical 90-day plan moves from connected systems → first autonomous workflow → measurable ROI, without a multi-quarter programme.",
  },
  {
    q: "Is BizzSurfer secure and compliant for regulated industries?",
    a: "Yes. BizzSurfer ships with role-based access control, full audit logging, SSO/SAML, encryption in transit and at rest, and support for private/VPC deployments. It is designed to align with SOC 2, GDPR, HIPAA, and ISO 27001 controls, making it suitable for finance, healthcare, insurance, and the public sector.",
  },
  {
    q: "Will Agentic AI replace our transformation team?",
    a: "No — it amplifies them. BizzSurfer is a co-pilot for transformation leaders: humans set strategy, approve key decisions, and own outcomes, while agents handle coordination, status-chasing, data wrangling, and execution. Teams typically reclaim 30–50% of their time and redirect it to higher-leverage strategic work.",
  },
  {
    q: "What ROI should executives expect from Agentic AI?",
    a: "Customers commonly report 3–6 month payback on initial workflows: 40–70% faster decision cycles, 25–40% reduction in change-management overhead, and double-digit lift in adoption of transformation initiatives. Use the ROI Calculator above to model your own numbers based on team size and initiative scope.",
  },
  {
    q: "Which enterprise systems does BizzSurfer connect to?",
    a: "BizzSurfer integrates with the systems transformation programmes actually run on: SAP, Oracle, Microsoft Dynamics, Salesforce, Workday, SuccessFactors, ServiceNow, Snowflake, Databricks, Jira, Confluence, Slack, Microsoft 365, and Google Workspace — plus REST, GraphQL, and webhook APIs for anything custom. New connectors are typically added in days, not quarters.",
  },
  {
    q: "How is Agentic AI different from RPA or traditional automation?",
    a: "RPA follows hard-coded rules and breaks when a screen or process changes. Agentic AI reasons about goals, handles ambiguity, calls tools and APIs dynamically, and learns from feedback. Where RPA automates a known task, Agentic AI orchestrates an outcome — even when the path to get there shifts.",
  },
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
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed font-semibold">
            Don't fall behind! Let's create a 90-day plan to implement Agentic AI and orchestrate your enterprise systems!
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <Button size="lg" className="bg-gradient-agentic text-white shadow-soft hover:opacity-95 h-12 font-bold text-lg" onClick={() => navigate({ to: "/chat" })}>
              Chat to BizzSurfer Go! <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 text-sm font-bold" onClick={() => setWaitOpen(true)}>
              Join the Agentic AI launch waitlist
            </Button>
          </div>
        </div>
      </section>

      {/* Last event — rewatch, above onboarding */}
      {pastEvents[0] && (
        <section className="px-5">
          <SectionHeader className="mb-3">Rewatch our Last Event!</SectionHeader>
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
                width={1200}
                height={675}
                className="w-full h-auto block"
                fetchPriority="high"
                decoding="async"
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

      {/* Featured video */}
      <FeaturedVideoHome />


      {/* Onboarding checklist */}
      <OnboardingChecklist />

      {/* Event quota widget */}
      <section className="px-5">
        <EventQuotaWidget />
      </section>




      {/* Go Agentic! */}
      <section className="px-5">
        <SectionHeader className="mb-3">Go Agentic!</SectionHeader>
        <Link
          to="/marketplace"
          className="group relative block overflow-hidden rounded-3xl border-2 border-solid border-[#4a5fb8] bg-card shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
        >
          {/* animated glow halo */}
          <span className="pointer-events-none absolute -inset-12 bg-[radial-gradient(circle_at_20%_20%,#4a5fb8_0%,transparent_55%),radial-gradient(circle_at_85%_85%,#e8853a_0%,transparent_55%)] blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="relative rounded-[20px] bg-card/95 backdrop-blur p-5 sm:p-6">
            {/* Top row: badges */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-agentic px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-soft">
                <Sparkles className="w-3 h-3" />
                Go Agentic!
              </span>
              <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
                Hot
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-agentic flex items-center justify-center shrink-0 shadow-glow ring-2 ring-white/40">
                <Bot className="w-8 h-8 text-white" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center shadow-soft">
                  <Sparkles className="w-3 h-3 text-accent-foreground" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight tracking-tight">
                  Agents, services & <span className="text-gradient-agentic">playbooks</span>
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-snug">
                  Curated tools, expert services & 90-day playbooks to accelerate your transformation.
                </p>
              </div>
            </div>

            {/* Stat strip */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { n: "50+", l: "Agents" },
                { n: "20+", l: "Services" },
                { n: "10+", l: "Playbooks" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-[#4a5fb8]/25 bg-gradient-to-br from-[#4a5fb8]/10 to-[#e8853a]/10 py-2">
                  <p className="text-sm font-extrabold text-gradient-agentic">{s.n}</p>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-gradient-agentic px-4 py-3 shadow-soft group-hover:shadow-glow transition">
              <span className="text-sm font-bold text-white">Explore the marketplace</span>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-white">
                Browse now
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* Powered by — compact, under ROI */}
      <PoweredBySection />

      {/* Explore & download */}
      <ResourcesSection />

      {/* Pain points */}
      <section id="reality-check" className="relative px-5 py-8 overflow-hidden scroll-mt-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-16 -left-10 w-56 h-56 rounded-full bg-primary/15 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 -right-10 w-56 h-56 rounded-full bg-accent/30 blur-3xl animate-pulse [animation-delay:1.5s]" />
        </div>

        <SectionHeader className="mb-3">Pain Points Checker</SectionHeader>
        <p className="mb-4 text-xs text-muted-foreground">Toggle what hurts and slide the intensity — we'll surface your top pain and prep a chat prompt.</p>

        <PainTracker items={painPoints} onSubmit={() => game.completeOnboardingStep("reality")} />
      </section>

      {/* ROI Calculator — under Pain Points Checker */}
      <section className="px-5">
        <SectionHeader className="mb-3">ROI Calculator</SectionHeader>
        <ROICalculator />
      </section>


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

      {/* Careers */}
      <CareersSection />

      {/* FAQs */}
      <section className="px-5">
        <SectionHeader className="mb-4"><span className="text-xl">FAQs | Frequently asked at the C-suite</span></SectionHeader>
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

        {/* Lead capture under FAQs */}
        <div className="mt-5 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-accent/10 p-4 shadow-card">
          <p className="text-sm font-bold text-foreground">Still have questions?</p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Get a tailored 90-day Agentic AI plan for your enterprise — no slides, just a roadmap.
          </p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <Button size="sm" className="bg-gradient-agentic text-white font-bold flex-1" onClick={() => navigate({ to: "/chat" })}>
              Ask BizzSurfer Go!
            </Button>
            <Button size="sm" variant="outline" className="font-bold flex-1" onClick={() => setWaitOpen(true)}>
              Get the 90-day plan
            </Button>
          </div>
        </div>
      </section>


      {/* Social media — rendered globally at end of every page via AppShell */}


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

      <TrustedPartnersSection />

      <FollowSection />

      <ConnectApisSection />

      {/* Footer links */}
      <footer className="px-5 pb-6 pt-2">
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground hover:underline transition-colors">
            Terms of Service
          </Link>
          <span className="text-border">|</span>
          <Link to="/privacy" className="hover:text-foreground hover:underline transition-colors">
            Privacy Policy
          </Link>
          <span className="text-border">|</span>
          <Link to="/contact" className="hover:text-foreground hover:underline transition-colors">
            Contact Us
          </Link>
        </div>
      </footer>

      <WaitlistDialog open={waitOpen} onOpenChange={setWaitOpen} onJoined={() => {
        game.update((s) => {
          const badges = s.badges.includes("Early Adopter") ? s.badges : [...s.badges, "Early Adopter"];
          return { ...s, xp: s.xp + 50, badges };
        });
      }} />
    </div>
  );
}
