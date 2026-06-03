import { createServerFn } from "@tanstack/react-start";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

const ALLOWED_RETURN_HOSTS = new Set<string>([
  "bizzsurfergo.lovable.app",
  "go.bizzsurfer.ai",
  "www.bizzsurfer.ai",
  "bizzsurfer.ai",
  "bizzsurfer.com",
  "www.bizzsurfer.com",
]);

function validateReturnUrl(raw: string): string {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("Invalid returnUrl");
  }
  const host = u.hostname.toLowerCase();
  const isLocal = host === "localhost" || host === "127.0.0.1";
  if (u.protocol !== "https:" && !(isLocal && u.protocol === "http:")) {
    throw new Error("returnUrl must use https");
  }
  const isLovable = host.endsWith(".lovable.app") || host.endsWith(".lovable.dev");
  if (!ALLOWED_RETURN_HOSTS.has(host) && !isLovable && !isLocal) {
    throw new Error("returnUrl host not allowed");
  }
  return raw;
}

const PASS_DURATION_HOURS = 24;

/**
 * Anonymous-allowed: 1€ one-off Stripe checkout that, when paid, grants a
 * 24-hour pass to read full BizzSurfer News articles. Funds donated to
 * children IT-skills programs.
 */
export const createNewsPassCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: { returnUrl: string; environment: StripeEnv }) => {
    validateReturnUrl(data.returnUrl);
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Invalid environment");
    }
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: ["news_day_pass_eur1"] });
      if (!prices.data.length) throw new Error("News pass price not configured");
      const price = prices.data[0];

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        payment_intent_data: {
          description: "BizzSurfer News — 24h Day Pass (donation to children IT-skills)",
        },
        metadata: { product: "news_day_pass" },
      });
      return session.client_secret;
    } catch (err) {
      const e = err as { message?: string };
      console.error("[news-pass] checkout_failed", e?.message ?? String(err));
      throw new Error("Could not start checkout. Please try again.");
    }
  });

/**
 * Verifies a checkout session is paid and returns an expiry timestamp
 * (now + 24h, anchored to the session creation time). The client stores
 * this in localStorage to gate full-article access.
 */
export const verifyNewsPass = createServerFn({ method: "POST" })
  .inputValidator((data: { sessionId: string; environment: StripeEnv }) => {
    if (!/^[a-zA-Z0-9_]+$/.test(data.sessionId)) throw new Error("Invalid sessionId");
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Invalid environment");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const stripe = createStripeClient(data.environment);
    const session = await stripe.checkout.sessions.retrieve(data.sessionId);
    const paid =
      session.payment_status === "paid" ||
      session.status === "complete";
    // Only honour sessions that were created for the News Day Pass product.
    // Without this guard, any other recent paid Stripe session id (e.g. a
    // marketplace purchase) would unlock the premium news body.
    if (session.metadata?.product !== "news_day_pass") {
      return { paid: false as const };
    }
    if (!paid) return { paid: false as const };
    const created = (session.created ?? Math.floor(Date.now() / 1000)) * 1000;
    const expiresAt = created + PASS_DURATION_HOURS * 60 * 60 * 1000;
    return { paid: true as const, expiresAt };
  });
