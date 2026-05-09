import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/hubspot";

const inputSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  role: z.string().max(200).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
});

export const upsertHubspotWaitlistContact = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;
    if (!HUBSPOT_API_KEY) throw new Error("HUBSPOT_API_KEY is not configured");

    const [firstname, ...rest] = data.name.trim().split(/\s+/);
    const lastname = rest.join(" ") || undefined;

    const properties: Record<string, string> = {
      email: data.email,
      firstname,
      ...(lastname ? { lastname } : {}),
      ...(data.role ? { jobtitle: data.role } : {}),
      ...(data.company ? { company: data.company } : {}),
      lifecyclestage: "lead",
      hs_lead_status: "NEW",
      lovable_source: "bizzsurfer-go-waitlist",
    };

    // Upsert by email — create then, on conflict (409), patch by email.
    const headers = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": HUBSPOT_API_KEY,
      "Content-Type": "application/json",
    };

    const createRes = await fetch(`${GATEWAY_URL}/crm/v3/objects/contacts`, {
      method: "POST",
      headers,
      body: JSON.stringify({ properties }),
    });

    if (createRes.ok) {
      const json = await createRes.json();
      return { ok: true as const, id: json.id, created: true };
    }

    if (createRes.status === 409) {
      const updateRes = await fetch(
        `${GATEWAY_URL}/crm/v3/objects/contacts/${encodeURIComponent(data.email)}?idProperty=email`,
        { method: "PATCH", headers, body: JSON.stringify({ properties }) },
      );
      if (!updateRes.ok) {
        const body = await updateRes.text();
        throw new Error(`HubSpot update failed [${updateRes.status}]: ${body}`);
      }
      const json = await updateRes.json();
      return { ok: true as const, id: json.id, created: false };
    }

    const body = await createRes.text();
    throw new Error(`HubSpot create failed [${createRes.status}]: ${body}`);
  });
