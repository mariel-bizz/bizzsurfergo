import { useGame } from "../AppShell";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Network, Users, Target, AlertTriangle, ChevronDown, Trophy, Rocket, Languages, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import banner from "@/assets/bizzsurfer-banner.webp";
import { WaitlistDialog } from "../WaitlistDialog";
import { ROICalculator } from "../ROICalculator";
import { ResourcesSection } from "../ResourcesSection";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧", greeting: "Hi" },
  { code: "es", label: "Español", flag: "🇪🇸", greeting: "Hola" },
  { code: "fr", label: "Français", flag: "🇫🇷", greeting: "Salut" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", greeting: "Hallo" },
  { code: "pt", label: "Português", flag: "🇵🇹", greeting: "Olá" },
  { code: "it", label: "Italiano", flag: "🇮🇹", greeting: "Ciao" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱", greeting: "Hoi" },
  { code: "zh", label: "中文", flag: "🇨🇳", greeting: "你好" },
  { code: "ja", label: "日本語", flag: "🇯🇵", greeting: "こんにちは" },
];

const painPoints = [
  { icon: Target, title: "Stalled transformation execution", desc: "Strategy decks land. Execution doesn't. Initiatives drift across silos with no shared signal." },
  { icon: Network, title: "Disconnected enterprise systems", desc: "ERP, HRIS, CRM, BI — each a fortress. Decisions wait on data that never arrives." },
  { icon: Users, title: "Change fatigue at every level", desc: "Leaders push. Middle management resists. Frontline disengages. Adoption stalls below 40%." },
  { icon: AlertTriangle, title: "AI agents that just don't decide", desc: "Most copilots wait for prompts. You need autonomous agents that orchestrate outcomes." },
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
  const [contact, setContact] = useState({ name: "", email: "", message: "", language: "en" });
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.name.trim() || !contact.email.trim() || !contact.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setContactSent(true);
    toast.success("Thanks! We'll be in touch.", {
      description: `Replying in ${LANGUAGES.find((l) => l.code === contact.language)?.label}.`,
    });
  };

  return (
    <div className="space-y-8 pt-2">
      {/* Banner */}
      <section className="px-5 pt-2">
        <div className="relative rounded-2xl overflow-hidden shadow-card border border-border">
          <a href="https://www.bizzsurfer.com" target="_blank" rel="noopener noreferrer" aria-label="Open bizzsurfer.com" className="block">
            <img src={banner} alt="BizzSurfer Agentic AI" className="w-full" width={1296} height={324} fetchPriority="high" decoding="async" />
          </a>
          <div className="absolute inset-x-0 top-0 flex justify-center p-3 pointer-events-none">
            <Button
              size="sm"
              onClick={() => setWaitOpen(true)}
              className="pointer-events-auto bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95 h-9 px-4 text-xs font-bold"
            >
              Join the Waitlist <ArrowRight className="ml-1 w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </section>

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



      {/* Contact form with language selection */}
      <section className="px-5">
        <div className="rounded-2xl bg-card border border-border p-5 shadow-card">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft shrink-0">
              <Send className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Get in touch</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Tell us about your transformation goals — choose your preferred language.</p>
            </div>
          </div>

          {contactSent ? (
            <div className="flex flex-col items-center text-center py-6 gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Message received</p>
                <p className="text-xs text-muted-foreground mt-1">We'll get back to you in {LANGUAGES.find((l) => l.code === contact.language)?.label}.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setContactSent(false);
                  setContact({ name: "", email: "", message: "", language: contact.language });
                }}
              >
                Send another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name" className="text-xs font-semibold">Name</Label>
                <Input
                  id="contact-name"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-email" className="text-xs font-semibold">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  placeholder="jane@company.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-language" className="text-xs font-semibold flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5" /> Preferred language
                </Label>
                <Select
                  value={contact.language}
                  onValueChange={(v) => setContact({ ...contact, language: v })}
                >
                  <SelectTrigger id="contact-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-message" className="text-xs font-semibold">Message</Label>
                <Textarea
                  id="contact-message"
                  rows={4}
                  value={contact.message}
                  onChange={(e) => setContact({ ...contact, message: e.target.value })}
                  placeholder="What would you like to discuss?"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95 h-11 font-bold">
                Send message <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Pain points */}
      <section className="px-5">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">The pain you feel</h2>
          <span className="text-xs text-muted-foreground">4 of 4</span>
        </div>
        <div className="space-y-3">
          {painPoints.map((p) => (
            <div key={p.title} className="rounded-2xl bg-card border border-border p-4 shadow-card flex gap-3">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
                <p.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{p.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
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

      {/* ROI Calculator */}
      <section className="px-5">
        <ROICalculator />
      </section>

      {/* Resources, partners, socials, integrations */}
      <ResourcesSection />

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

      <WaitlistDialog open={waitOpen} onOpenChange={setWaitOpen} onJoined={() => {
        game.update((s) => {
          const badges = s.badges.includes("Early Adopter") ? s.badges : [...s.badges, "Early Adopter"];
          return { ...s, xp: s.xp + 50, badges };
        });
      }} />
    </div>
  );
}
