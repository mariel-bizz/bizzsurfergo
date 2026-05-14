import { useEffect, useState } from "react";
import { useGame } from "../AppShell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Clock, MapPin, Users, Mic, Linkedin, CalendarPlus, Check, X, Video } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import event1 from "@/assets/event-mariel.png";
import event2 from "@/assets/event-chro-playbook.png";
import event3 from "@/assets/event-boards-csuite.png";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { events as eventsData, pastEvents } from "@/lib/events-data";
import { googleCalendarUrl, outlookCalendarUrl, icsDownloadUrl } from "@/lib/calendar-links";
import { rsvpToEvent, listMyRsvps, cancelRsvp } from "@/lib/rsvp.functions";
import { RsvpConfirmationDialog } from "@/components/events/RsvpConfirmationDialog";
import type { FeedEvent } from "@/lib/events-data";

const images: Record<number, string> = { 1: event1, 2: event2, 3: event3 };

const events = eventsData.map((e) => ({ ...e, image: images[e.id] }));

export function EventsTab() {
  const game = useGame();
  const navigate = useNavigate();
  const rsvp = useServerFn(rsvpToEvent);
  const cancel = useServerFn(cancelRsvp);
  const listRsvps = useServerFn(listMyRsvps);
  const [rsvpedIds, setRsvpedIds] = useState<number[]>([]);
  const [meetLinks, setMeetLinks] = useState<Record<number, string>>({});
  const [authed, setAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [confirmation, setConfirmation] = useState<{ event: FeedEvent; meetLink?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const isAuthed = !!data.session;
      setAuthed(isAuthed);
      setUserEmail(data.session?.user?.email ?? "");
      if (isAuthed) {
        listRsvps()
          .then((r) => {
            setRsvpedIds(r.eventIds);
            setMeetLinks(r.meetLinks ?? {});
          })
          .catch(() => {});
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      setUserEmail(session?.user?.email ?? "");
    });
    return () => sub.subscription.unsubscribe();
  }, [listRsvps]);

  const handleRsvp = async (id: number, href: string) => {
    if (!authed) {
      toast.info("Sign in to RSVP and get email reminders.");
      navigate({ to: "/login", search: { redirect: "/events" } });
      return;
    }
    try {
      const res = await rsvp({ data: { eventId: id } });
      setRsvpedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      const meet = res?.meet_link as string | undefined;
      if (meet) {
        setMeetLinks((prev) => ({ ...prev, [id]: meet }));
      }
      game.update((s) => {
        const badges = s.badges.includes("Event Insider") ? s.badges : [...s.badges, "Event Insider"];
        return { ...s, xp: s.xp + 25, badges };
      });
      const ev = eventsData.find((x) => x.id === id);
      if (ev) setConfirmation({ event: ev, meetLink: meet });
      toast.success("You're in! +25 XP");
      if (href !== "#") window.open(href, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "RSVP failed");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancel({ data: { eventId: id } });
      setRsvpedIds((prev) => prev.filter((x) => x !== id));
      setMeetLinks((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.success("RSVP cancelled. No more reminders for this event.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    }
  };

  return (
    <div className="px-5 py-5 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Executive Events</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live conversations shaping Agentic AI for business transformation.
        </p>
      </div>


      {events.map((e) => {
        const isRsvped = rsvpedIds.includes(e.id);
        return (
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
                {e.id === 1 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    <Linkedin className="w-2.5 h-2.5" /> LinkedIn
                  </span>
                )}
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
              {isRsvped && meetLinks[e.id] && (
                <a
                  href={meetLinks[e.id]}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/30 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
                >
                  <Video className="w-4 h-4" /> Join Google Meet
                  <span className="ml-auto truncate opacity-70">{meetLinks[e.id].replace(/^https?:\/\//, "")}</span>
                </a>
              )}
              <div className="flex gap-2 pt-1">
                {isRsvped ? (
                  <Button
                    onClick={() => handleCancel(e.id)}
                    variant="outline"
                    className="flex-1 h-11 font-bold border-primary/40 text-foreground"
                  >
                    <Check className="w-4 h-4 mr-1 text-primary" /> RSVP'd · Cancel
                    <X className="w-3.5 h-3.5 ml-1 opacity-70" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleRsvp(e.id, e.href)}
                    className="flex-1 bg-gradient-primary shadow-soft h-11 font-bold"
                  >
                    {e.cta}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label="Add to calendar">
                      <CalendarPlus className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <a href={googleCalendarUrl(eventsData.find((x) => x.id === e.id)!)} target="_blank" rel="noreferrer">
                        Google Calendar
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={outlookCalendarUrl(eventsData.find((x) => x.id === e.id)!)} target="_blank" rel="noreferrer">
                        Outlook / Teams
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={icsDownloadUrl(eventsData.find((x) => x.id === e.id)!)} download>
                        Download .ics (Apple, others)
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </article>
        );
      })}

      <section className="pt-4">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-bold text-foreground">Past Events</h2>
          <span className="h-px flex-1 bg-border" />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Replays and recaps from previous BizzSurfer Go! sessions.
        </p>
        <div className="space-y-3">
          {pastEvents.map((e) => (
            <article
              key={e.id}
              className="rounded-2xl bg-card border border-border shadow-card p-4 opacity-95 py-[6px]"
            >
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {e.badge}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Past
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground leading-tight">{e.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{e.subtitle}</p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Meta icon={Calendar} label={e.date} />
                <Meta icon={Clock} label={e.time} />
                <Meta icon={MapPin} label={e.location} />
                <Meta icon={Users} label={e.audience} />
              </div>
              <div className="flex items-center gap-2 pt-2 mt-2 border-t border-border">
                <Mic className="w-4 h-4 text-primary" />
                <p className="text-xs font-medium text-foreground">{e.speaker}</p>
              </div>
              {e.href && e.href !== "#" && (
                <a
                  href={e.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  {""}
                </a>
              )}
            </article>
          ))}
        </div>
      </section>

      <RsvpConfirmationDialog
        open={!!confirmation}
        onOpenChange={(o) => !o && setConfirmation(null)}
        event={confirmation?.event ?? null}
        email={userEmail}
        meetLink={confirmation?.meetLink}
      />
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
