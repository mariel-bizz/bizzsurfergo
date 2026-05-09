import { useGame } from "../AppShell";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Mic, Linkedin } from "lucide-react";
import event1 from "@/assets/event-mariel.png";
import { toast } from "sonner";

const events = [
  {
    id: 1,
    badge: "LIVE EVENT",
    title: "Agentic AI vs AI agents",
    subtitle: "Learn how autonomous Agentic AI can be a business game-changer",
    date: "May 14, 2026",
    time: "17:00 CET",
    location: "LinkedIn Live",
    audience: "Leaders, Innovators & Business Builders",
    speaker: "Mariel Schaab — CEO & Founder, BizzSurfer",
    image: event1,
    cta: "Register on LinkedIn",
    href: "https://www.linkedin.com",
  },
  {
    id: 2,
    badge: "ROUNDTABLE",
    title: "The CHRO playbook for Agentic AI",
    subtitle: "Closed roundtable for Chief People Officers redesigning the workforce.",
    date: "Jun 11, 2026",
    time: "16:00 CET",
    location: "Virtual — Invite only",
    audience: "CHROs & Heads of People",
    speaker: "BizzSurfer Executive Circle",
    image: null,
    cta: "Request invitation",
    href: "#",
  },
  {
    id: 3,
    badge: "MASTERCLASS",
    title: "Agentic AI for Boards & C-Suite",
    subtitle: "A 90-minute executive masterclass: from strategy to orchestration.",
    date: "Jul 02, 2026",
    time: "15:00 CET",
    location: "Live online",
    audience: "Board members, CEOs, COOs",
    speaker: "BizzSurfer Faculty",
    image: null,
    cta: "Save my seat",
    href: "#",
  },
];

export function EventsTab() {
  const game = useGame();
  const register = (id: number, href: string) => {
    game.update((s) => {
      const badges = s.badges.includes("Event Insider") ? s.badges : [...s.badges, "Event Insider"];
      return { ...s, xp: s.xp + 25, badges };
    });
    toast.success("You earned +25 XP — Event Insider unlocked!");
    if (href !== "#") window.open(href, "_blank");
  };

  return (
    <div className="px-5 py-5 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Executive Events</h1>
        <p className="text-sm text-muted-foreground mt-1">Live conversations shaping Agentic AI for business transformation.</p>
      </div>

      {events.map((e) => (
        <article key={e.id} className="rounded-3xl bg-card border border-border shadow-card overflow-hidden">
          {e.image ? (
            <img src={e.image} alt={e.title} className="w-full aspect-[3/2] object-cover" />
          ) : (
            <div className="aspect-[3/2] bg-gradient-deep flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 wave-bg opacity-60" />
              <Mic className="w-16 h-16 text-primary-foreground relative" />
            </div>
          )}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> {e.badge}
              </span>
              {e.id === 1 && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground"><Linkedin className="w-2.5 h-2.5" /> LinkedIn</span>}
            </div>
            <h2 className="text-lg font-bold text-foreground leading-tight">{e.title}</h2>
            <p className="text-sm text-muted-foreground">{e.subtitle}</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Meta icon={Calendar} label={e.date} />
              <Meta icon={Clock} label={e.time} />
              <Meta icon={MapPin} label={e.location} />
              <Meta icon={Users} label={e.audience} />
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-border mt-2">
              <Mic className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium text-foreground">{e.speaker}</p>
            </div>
            <Button onClick={() => register(e.id, e.href)} className="w-full bg-gradient-primary shadow-soft h-11 font-bold">
              {e.cta}
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Meta({ icon: Icon, label }: { icon: typeof Calendar; label: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
      <span className="text-xs text-muted-foreground leading-snug">{label}</span>
    </div>
  );
}
