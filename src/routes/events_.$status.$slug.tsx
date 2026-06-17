import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import {
  findEventBySlug,
  eventDate,
  eventLink,
  eventStatus,
  type FeedEvent,
} from "@/lib/events-data";
import {
  googleCalendarUrl,
  outlookCalendarUrl,
  icsDownloadUrl,
  eventEndDate,
} from "@/lib/calendar-links";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Mic,
  ArrowLeft,
  CalendarPlus,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SITE = "https://go.bizzsurfer.ai";
type Status = "upcoming" | "past";

export const Route = createFileRoute("/events_/$status/$slug")({
  loader: ({ params }) => {
    const status = params.status as Status;
    if (status !== "upcoming" && status !== "past") throw notFound();
    const event = findEventBySlug(params.slug);
    if (!event || eventStatus(event) !== status) throw notFound();
    return { event, status };
  },
  head: ({ params, loaderData }) => {
    const e = loaderData?.event as FeedEvent | undefined;
    const url = `${SITE}/events/${params.status}/${params.slug}`;
    if (!e) {
      return {
        meta: [
          { title: "Event — BizzSurfer Go!" },
          { name: "description", content: "BizzSurfer executive event." },
        ],
      };
    }
    const description = `${e.subtitle} — ${e.date} at ${e.time}. ${e.location}. Speaker: ${e.speaker}.`;
    return {
      meta: [
        { title: `${e.title} — BizzSurfer Go!` },
        { name: "description", content: description },
        { property: "og:title", content: e.title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: e.title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: e.title,
            description: e.subtitle,
            startDate: eventDate(e).toISOString(),
            endDate: eventEndDate(e).toISOString(),
            eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
            eventStatus: "https://schema.org/EventScheduled",
            location: {
              "@type": "VirtualLocation",
              url: eventLink(e),
              name: e.location,
            },
            organizer: { "@type": "Organization", name: "BizzSurfer", url: SITE },
            performer: { "@type": "Person", name: e.speaker },
            url,
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <p className="text-muted-foreground">
          This event link is invalid or expired.
        </p>
        <Button asChild>
          <Link to="/events">Browse all events</Link>
        </Button>
      </div>
    </div>
  ),
  component: EventDetailPage,
});

function EventDetailPage() {
  const { event: e, status } = Route.useLoaderData();
  const link = eventLink(e);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> All events
        </Link>

        <div className="space-y-3">
          <Badge variant="secondary" className="uppercase tracking-wide">
            {e.badge}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
            {e.title}
          </h1>
          <p className="text-lg text-muted-foreground">{e.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 p-4 rounded-xl border bg-card">
          <InfoRow icon={Calendar} label={e.date} />
          <InfoRow icon={Clock} label={e.time} />
          <InfoRow icon={MapPin} label={e.location} />
          <InfoRow icon={Users} label={e.audience} />
          <InfoRow icon={Mic} label={e.speaker} />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={link} target="_blank" rel="noopener noreferrer">
              {e.cta} <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
          {status === "upcoming" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg">
                  <CalendarPlus className="w-4 h-4 mr-2" /> Add to calendar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <a href={googleCalendarUrl(e)} target="_blank" rel="noopener noreferrer">
                    Google Calendar
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={outlookCalendarUrl(e)} target="_blank" rel="noopener noreferrer">
                    Outlook
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={icsDownloadUrl(e)}>Apple / .ics</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span>{label}</span>
    </div>
  );
}
