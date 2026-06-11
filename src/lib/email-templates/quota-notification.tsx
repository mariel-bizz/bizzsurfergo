import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

type Kind = "last_slot" | "exhausted" | "reset";

interface Props {
  name?: string;
  kind?: Kind;
  tierLabel?: string;
  period?: "month" | "year";
  limit?: number;
  remaining?: number;
  upgradeUrl?: string;
  eventsUrl?: string;
}

const HEADERS: Record<Kind, string> = {
  last_slot: "You have 1 event RSVP left",
  exhausted: "You've used all your event RSVPs",
  reset: "Your event RSVPs just reset",
};

export function QuotaNotificationEmail({
  name = "there",
  kind = "last_slot",
  tierLabel = "Your plan",
  period = "month",
  limit = 0,
  remaining = 0,
  upgradeUrl = "https://go.bizzsurfer.ai/pricing",
  eventsUrl = "https://go.bizzsurfer.ai/events",
}: Props) {
  const showUpgrade = kind !== "reset";
  return (
    <Html>
      <Head />
      <Preview>{HEADERS[kind]}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif", margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
          <Heading style={{ color: "#0f172a", fontSize: 22 }}>Hi {name}, {HEADERS[kind].toLowerCase()}.</Heading>
          <Section style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginTop: 12 }}>
            <Text style={{ margin: 0, color: "#0f172a", fontSize: 14 }}>
              <b>Plan:</b> {tierLabel}
            </Text>
            {kind !== "reset" && (
              <Text style={{ margin: "4px 0 0", color: "#0f172a", fontSize: 14 }}>
                <b>This {period}:</b> {limit - remaining} of {limit} used · {remaining} left
              </Text>
            )}
            {kind === "reset" && (
              <Text style={{ margin: "4px 0 0", color: "#0f172a", fontSize: 14 }}>
                You have a fresh {limit ?? "set"} RSVP{limit === 1 ? "" : "s"} for this {period}.
              </Text>
            )}
          </Section>
          <Text style={{ color: "#334155", fontSize: 14, marginTop: 16 }}>
            {kind === "exhausted"
              ? "Upgrade to Champion or Team for unlimited event RSVPs, or join the waitlist on a specific event to be notified when a seat opens."
              : kind === "last_slot"
                ? "Make it count — pick the executive session that matters most this period."
                : "Welcome back. Browse upcoming events and RSVP to keep your learning streak."}
          </Text>
          <Button
            href={showUpgrade ? upgradeUrl : eventsUrl}
            style={{ background: "#1D4ED8", color: "#fff", padding: "12px 20px", borderRadius: 8, fontWeight: 700, marginTop: 8 }}
          >
            {showUpgrade ? "See upgrade options" : "Browse events"}
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: QuotaNotificationEmail,
  subject: (d: Record<string, unknown>) => HEADERS[(d.kind as Kind) ?? "last_slot"],
  displayName: "Event quota notification",
  previewData: { name: "Mariel", kind: "last_slot", tierLabel: "Hero", period: "month", limit: 2, remaining: 1 },
} satisfies TemplateEntry;
