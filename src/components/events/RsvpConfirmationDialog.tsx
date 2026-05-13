import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, CheckCircle2, Mail, CalendarPlus, Video } from "lucide-react";
import type { FeedEvent } from "@/lib/events-data";
import { googleCalendarUrl, outlookCalendarUrl, icsDownloadUrl } from "@/lib/calendar-links";

interface RsvpConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: FeedEvent | null;
  email: string;
  meetLink?: string;
}

export function RsvpConfirmationDialog({
  open,
  onOpenChange,
  event,
  email,
  meetLink,
}: RsvpConfirmationDialogProps) {
  if (!event) return null;
  const sentAt = new Date().toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">RSVP confirmed</DialogTitle>
        <DialogDescription className="sr-only">
          Your RSVP for {event.title} is confirmed. A receipt has been sent to {email}.
        </DialogDescription>

        {/* Banner */}
        <div className="bg-gradient-deep text-white px-5 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest font-bold opacity-90">RSVP confirmed</p>
            <p className="text-base font-bold truncate">You're on the list!</p>
          </div>
        </div>

        {/* Email-style receipt */}
        <div className="bg-card">
          <div className="px-5 py-3 border-b border-border space-y-1 text-xs">
            <ReceiptRow label="From" value="events@bizzsurfer.ai" />
            <ReceiptRow label="To" value={email || "you"} />
            <ReceiptRow label="Subject" value={`You're confirmed: ${event.title}`} />
            <ReceiptRow label="Sent" value={sentAt} mono />
          </div>

          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-foreground">
              Thanks for RSVPing. Here are your event details — a copy has been emailed
              to you with a calendar invite.
            </p>

            <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2">
              <h3 className="text-sm font-bold text-foreground leading-snug">{event.title}</h3>
              <p className="text-xs text-muted-foreground">{event.subtitle}</p>
              <div className="grid grid-cols-1 gap-1.5 pt-2">
                <Meta icon={Calendar} label={event.date} />
                <Meta icon={Clock} label={event.time} />
                <Meta icon={MapPin} label={event.location} />
              </div>
            </div>

            {meetLink && (
              <a
                href={meetLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/30 px-3 py-2.5 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
              >
                <Video className="w-4 h-4 shrink-0" /> Join Google Meet
              </a>
            )}

            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <CalendarPlus className="w-3 h-3" /> Add to calendar
              </p>
              <div className="grid grid-cols-3 gap-2">
                <CalBtn href={googleCalendarUrl(event)}>Google</CalBtn>
                <CalBtn href={outlookCalendarUrl(event)}>Outlook</CalBtn>
                <CalBtn href={icsDownloadUrl(event)} download>.ics</CalBtn>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-[11px] text-muted-foreground">
              <Mail className="w-3.5 h-3.5 shrink-0 text-primary" />
              Receipt and reminders sent to {email || "your email"}.
            </div>
          </div>

          <div className="px-5 pb-5">
            <Button onClick={() => onOpenChange(false)} className="w-full bg-gradient-primary font-bold h-11">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="w-14 shrink-0 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] pt-0.5">
        {label}
      </span>
      <span className={`text-foreground truncate ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}

function Meta({ icon: Icon, label }: { icon: typeof Calendar; label: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
      <span className="text-xs text-foreground leading-snug">{label}</span>
    </div>
  );
}

function CalBtn({ href, children, download }: { href: string; children: React.ReactNode; download?: boolean }) {
  return (
    <a
      href={href}
      target={download ? undefined : "_blank"}
      rel="noreferrer"
      download={download}
      className="text-center rounded-lg border border-border bg-card px-2 py-2 text-[11px] font-semibold text-foreground hover:border-primary/40 hover:bg-secondary transition"
    >
      {children}
    </a>
  );
}
