import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    priceId: string;
    quantity?: number;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const customerEmail = (claims?.email as string | undefined) ?? undefined;
    const stripe = createStripeClient(data.environment);

    const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
    if (!prices.data.length) throw new Error("Price not found");
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    const customerId = await resolveOrCreateCustomer(stripe, {
      email: customerEmail,
      userId,
    });

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: data.quantity || 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: data.returnUrl,
      automatic_tax: { enabled: true },
      customer: customerId,
      customer_update: { address: "auto", name: "auto" },
      metadata: { userId },
      ...(isRecurring && { subscription_data: { metadata: { userId } } }),
    });

    return session.client_secret;
  });

export const createMarketplaceListingCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    listingId: string;
    listingTitle: string;
    amountInCents: number;
    currency: "eur";
    interval: "month" | null;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.listingId)) throw new Error("Invalid listingId");
    if (!Number.isInteger(data.amountInCents) || data.amountInCents < 50) {
      throw new Error("Amount must be at least 50 cents");
    }
    if (data.listingTitle.length > 250) throw new Error("Title too long");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const customerEmail = (claims?.email as string | undefined) ?? undefined;
    const stripe = createStripeClient(data.environment);

    const customerId = await resolveOrCreateCustomer(stripe, {
      email: customerEmail,
      userId,
    });

    const isRecurring = data.interval === "month";
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: data.currency,
          product_data: {
            name: data.listingTitle,
            metadata: { listingId: data.listingId },
          },
          unit_amount: data.amountInCents,
          ...(isRecurring && { recurring: { interval: "month" } }),
        },
        quantity: 1,
      }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: data.returnUrl,
      automatic_tax: { enabled: true },
      customer: customerId,
      customer_update: { address: "auto", name: "auto" },
      metadata: { userId, listingId: data.listingId },
      ...(isRecurring && {
        subscription_data: { metadata: { userId, listingId: data.listingId } },
      }),
    });

    return session.client_secret;
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError || !sub?.stripe_customer_id) throw new Error("No subscription found");

    const stripe = createStripeClient(data.environment);
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id as string,
      ...(data.returnUrl && { return_url: data.returnUrl }),
    });
    return portal.url;
  });
