import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  name?: string;
  eventTitle?: string;
  eventDate?: string;
  rsvpUrl?: string;
}

export function EventWaitlistOpenEmail({
  name = "there",
  eventTitle = "your event",
  eventDate = "",
  rsvpUrl = "https://go.bizzsurfer.ai/events",
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`A spot just opened for ${eventTitle}`}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif", margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
          <Heading style={{ color: "#0f172a", fontSize: 22 }}>Good news, {name} — a spot opened.</Heading>
          <Section style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginTop: 12 }}>
            <Text style={{ margin: 0, color: "#0f172a", fontSize: 16, fontWeight: 700 }}>{eventTitle}</Text>
            {eventDate && <Text style={{ margin: "4px 0 0", color: "#475569", fontSize: 13 }}>{eventDate}</Text>}
          </Section>
          <Text style={{ color: "#334155", fontSize: 14, marginTop: 16 }}>
            You were on the waitlist. Confirm your RSVP now — seats are first-come, first-served.
          </Text>
          <Button href={rsvpUrl} style={{ background: "#1D4ED8", color: "#fff", padding: "12px 20px", borderRadius: 8, fontWeight: 700, marginTop: 8 }}>
            Confirm RSVP
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: EventWaitlistOpenEmail,
  subject: (d: Record<string, unknown>) => `A spot opened: ${(d.eventTitle as string) || "your event"}`,
  displayName: "Event Waitlist — spot opened",
  previewData: { name: "Mariel", eventTitle: "Boards & C-Suite Roundtable", eventDate: "June 25, 5pm CET", rsvpUrl: "https://go.bizzsurfer.ai/events" },
} satisfies TemplateEntry;
