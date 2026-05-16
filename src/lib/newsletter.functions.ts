import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";

const InputSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().max(120).optional().nullable(),
  // Honeypot — bots fill this, humans don't
  website: z.string().max(0).optional().nullable(),
  // Minimum render time (ms) to discourage instant bot submits
  elapsedMs: z.number().int().min(0).max(86_400_000).optional(),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    // Honeypot / timing checks
    if (data.website && data.website.length > 0) {
      return { success: true as const }; // silently accept bots
    }
    if (typeof data.elapsedMs === "number" && data.elapsedMs < 1500) {
      return { success: true as const };
    }

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY is not configured");

    const listIdRaw = process.env.BREVO_NEWSLETTER_LIST_ID;
    const listIds = listIdRaw
      ? listIdRaw
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => Number.isFinite(n))
      : [];

    const body: Record<string, unknown> = {
      email: data.email,
      updateEnabled: true,
      attributes: data.name
        ? { FIRSTNAME: data.name, SOURCE: "bizzsurfer_newsletter_popup" }
        : { SOURCE: "bizzsurfer_newsletter_popup" },
    };
    if (listIds.length > 0) body.listIds = listIds;

    const res = await fetch(`${GATEWAY_URL}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": BREVO_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      // Brevo returns 400 with code "duplicate_parameter" if the contact exists
      // and updateEnabled is false. With updateEnabled:true this should not occur,
      // but treat existing contacts as success either way.
      if (res.status === 400 && /duplicate/i.test(text)) {
        return { success: true as const, alreadySubscribed: true };
      }
      throw new Error(`Brevo subscribe failed [${res.status}]: ${text}`);
    }

    return { success: true as const };
  });
