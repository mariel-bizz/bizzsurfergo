export type FeedEvent = {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  date: string; // e.g. "May 14, 2026"
  time: string; // e.g. "17:00 CET"
  location: string;
  audience: string;
  speaker: string;
  cta: string;
  href: string;
};

export const SITE = "https://bizzsurfergo.lovable.app";

export const events: FeedEvent[] = [
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
    cta: "Register on LinkedIn",
    href: "https://www.linkedin.com",
  },
  {
    id: 2,
    badge: "ROUNDTABLE",
    title: "The CHRO playbook for Agentic AI",
    subtitle: "Closed roundtable for Chief People Officers redesigning the workforce.",
    date: "Jun 18, 2026",
    time: "16:00 CET",
    location: "Virtual — Invite only",
    audience: "CHROs & Heads of People",
    speaker: "BizzSurfer Executive Circle",
    cta: "Request invitation",
    href: "#",
  },
  {
    id: 3,
    badge: "MASTERCLASS",
    title: "Agentic AI for Boards & C-Suite",
    subtitle: "A 90-minute executive masterclass: from strategy to orchestration.",
    date: "Jun 4, 2026",
    time: "15:00 CET",
    location: "Live online",
    audience: "Board members, CEOs, COOs",
    speaker: "BizzSurfer Faculty",
    cta: "Save my seat",
    href: "#",
  },
];

// Convert "May 14, 2026" + "17:00 CET" -> Date (CET = UTC+1)
export function eventDate(e: FeedEvent): Date {
  const [hh, mm] = e.time.split(" ")[0].split(":").map(Number);
  const d = new Date(`${e.date} UTC`);
  // CET is UTC+1; subtract 1h to get UTC instant
  d.setUTCHours(hh - 1, mm, 0, 0);
  return d;
}

export function eventLink(e: FeedEvent): string {
  return e.href && e.href !== "#" ? e.href : `${SITE}/events#event-${e.id}`;
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
