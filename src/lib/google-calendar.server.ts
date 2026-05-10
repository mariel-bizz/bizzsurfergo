// Server-only helpers to talk to Google Calendar via the Lovable connector gateway.
// Uses Mariel's Google Calendar account (linked via the BizzSurfer GO! Calendar connection).

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

function authHeaders() {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  const GOOGLE_CALENDAR_API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!GOOGLE_CALENDAR_API_KEY) throw new Error("GOOGLE_CALENDAR_API_KEY is not configured");
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GOOGLE_CALENDAR_API_KEY,
    "Content-Type": "application/json",
  } as const;
}

export type CalendarEventResult = {
  id: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string; label?: string }>;
  };
  attendees?: Array<{ email: string; responseStatus?: string }>;
};

export async function createCalendarEventWithMeet(params: {
  calendarId?: string;
  summary: string;
  description?: string;
  location?: string;
  startISO: string;
  endISO: string;
  timeZone?: string;
}): Promise<CalendarEventResult> {
  const calendarId = params.calendarId ?? "primary";
  const requestId = `bizzsurfer-${crypto.randomUUID()}`;
  const url = `${GATEWAY_URL}/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`;
  const body = {
    summary: params.summary,
    description: params.description,
    location: params.location,
    start: { dateTime: params.startISO, timeZone: params.timeZone ?? "Europe/Paris" },
    end: { dateTime: params.endISO, timeZone: params.timeZone ?? "Europe/Paris" },
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
    guestsCanSeeOtherGuests: false,
    guestsCanInviteOthers: false,
  };
  const res = await fetch(url, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
  const data = (await res.json()) as CalendarEventResult & { error?: unknown };
  if (!res.ok) {
    throw new Error(`Google Calendar create failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function addAttendeeToEvent(params: {
  calendarId?: string;
  eventId: string;
  email: string;
  displayName?: string;
}): Promise<CalendarEventResult> {
  const calendarId = params.calendarId ?? "primary";
  const getUrl = `${GATEWAY_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(params.eventId)}`;
  const getRes = await fetch(getUrl, { headers: authHeaders() });
  const current = (await getRes.json()) as CalendarEventResult & { error?: unknown };
  if (!getRes.ok) {
    throw new Error(`Google Calendar get failed [${getRes.status}]: ${JSON.stringify(current)}`);
  }
  const attendees = current.attendees ?? [];
  const lower = params.email.toLowerCase();
  if (attendees.some((a) => a.email?.toLowerCase() === lower)) {
    return current;
  }
  const next = [...attendees, { email: params.email, displayName: params.displayName }];
  const patchUrl = `${getUrl}?sendUpdates=all&conferenceDataVersion=1`;
  const patchRes = await fetch(patchUrl, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ attendees: next }),
  });
  const patched = (await patchRes.json()) as CalendarEventResult & { error?: unknown };
  if (!patchRes.ok) {
    throw new Error(`Google Calendar patch failed [${patchRes.status}]: ${JSON.stringify(patched)}`);
  }
  return patched;
}

export async function removeAttendeeFromEvent(params: {
  calendarId?: string;
  eventId: string;
  email: string;
}): Promise<void> {
  const calendarId = params.calendarId ?? "primary";
  const getUrl = `${GATEWAY_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(params.eventId)}`;
  const getRes = await fetch(getUrl, { headers: authHeaders() });
  const current = (await getRes.json()) as CalendarEventResult & { error?: unknown };
  if (!getRes.ok) return; // best-effort
  const lower = params.email.toLowerCase();
  const next = (current.attendees ?? []).filter((a) => a.email?.toLowerCase() !== lower);
  await fetch(`${getUrl}?sendUpdates=all`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ attendees: next }),
  });
}

export function extractMeetLink(ev: CalendarEventResult): string | undefined {
  if (ev.hangoutLink) return ev.hangoutLink;
  const ep = ev.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video");
  return ep?.uri;
}
