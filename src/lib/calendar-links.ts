import { eventDate, type FeedEvent, eventLink, SITE } from "./events-data";

const DURATION_MINUTES = 90;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toICSDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    "00Z"
  );
}

export function eventEndDate(e: FeedEvent): Date {
  const start = eventDate(e);
  return new Date(start.getTime() + DURATION_MINUTES * 60_000);
}

export function buildICS(e: FeedEvent): string {
  const start = eventDate(e);
  const end = eventEndDate(e);
  const url = eventLink(e);
  const description = `${e.subtitle}\\n\\nSpeaker: ${e.speaker}\\n${url}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BizzSurfer//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:bizzsurfer-event-${e.id}@bizzsurfergo.lovable.app`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICS(e.title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `LOCATION:${escapeICS(e.location)}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function googleCalendarUrl(e: FeedEvent): string {
  const start = eventDate(e);
  const end = eventEndDate(e);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${toICSDate(start)}/${toICSDate(end)}`,
    details: `${e.subtitle}\n\nSpeaker: ${e.speaker}\n${eventLink(e)}`,
    location: e.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(e: FeedEvent): string {
  const start = eventDate(e);
  const end = eventEndDate(e);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: e.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: `${e.subtitle}\n\nSpeaker: ${e.speaker}\n${eventLink(e)}`,
    location: e.location,
  });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function icsDownloadUrl(e: FeedEvent): string {
  return `${SITE}/api/public/events/${e.id}.ics`;
}
