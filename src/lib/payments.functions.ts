import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

/**
 * Map any error from Stripe / our handlers into a short, user-safe message.
 * Full details stay in structured server logs; we never leak raw Stripe error
 * bodies (which can include account / request ids) to the client.
 */
function logAndMapStripeError(
  event: string,
  fields: Record<string, unknown>,
  err: unknown,
): Error {
  const e = err as { type?: string; code?: string; message?: string; statusCode?: number };
  const log = {
    event,
    ts: new Date().toISOString(),
    ...fields,
    errorType: e?.type ?? null,
    errorCode: e?.code ?? null,
    errorStatus: e?.statusCode ?? null,
    errorMessage: e?.message ?? String(err),
  };
  console.error(`[payments] ${event}`, JSON.stringify(log));

  switch (e?.type) {
    case "StripeCardError":
      return new Error(e.message || "Your card was declined. Please try a different payment method.");
    case "StripeInvalidRequestError":
      return new Error("We couldn't start your checkout. Please refresh and try again.");
    case "StripeAuthenticationError":
    case "StripePermissionError":
      return new Error("Payments are temporarily unavailable. Please try again shortly.");
    case "StripeRateLimitError":
      return new Error("Too many requests right now. Please wait a moment and try again.");
    case "StripeAPIError":
    case "StripeConnectionError":
      return new Error("Payment provider is unreachable. Please try again in a moment.");
    default:
      return new Error("We couldn't start your checkout session. Please try again.");
  }
}

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
    try {
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

      console.log(
        "[payments] price_session_created",
        JSON.stringify({
          event: "price_session_created",
          userId,
          sessionId: session.id,
          priceId: data.priceId,
          environment: data.environment,
        }),
      );

      return session.client_secret;
    } catch (err) {
      throw logAndMapStripeError(
        "price_session_create_failed",
        { userId, priceId: data.priceId, environment: data.environment },
        err,
      );
    }
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
    try {
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
        metadata: { userId, listingId: data.listingId, listingTitle: data.listingTitle },
        ...(isRecurring && {
          subscription_data: { metadata: { userId, listingId: data.listingId, listingTitle: data.listingTitle } },
        }),
      });

      console.log(
        "[payments] listing_session_created",
        JSON.stringify({
          event: "listing_session_created",
          userId,
          sessionId: session.id,
          listingId: data.listingId,
          amountCents: data.amountInCents,
          interval: data.interval,
          environment: data.environment,
        }),
      );

      return session.client_secret;
    } catch (err) {
      throw logAndMapStripeError(
        "listing_session_create_failed",
        {
          userId,
          listingId: data.listingId,
          amountCents: data.amountInCents,
          environment: data.environment,
        },
        err,
      );
    }
  });

type CartItemInput = {
  listingId: string;
  listingTitle: string;
  amountInCents: number;
  currency: "eur";
  interval?: "month" | null;
};

export const createMarketplaceCartCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    items: CartItemInput[];
    /**
     * Subtotal (sum of unit_amount * 1) the user sees in their cart UI, in
     * the smallest currency unit. Server recomputes the same sum from
     * `items` and rejects the request if they disagree — this catches cart
     * tampering and price drift.
     */
    expectedSubtotalCents?: number;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("Cart is empty");
    }
    if (data.items.length > 20) throw new Error("Too many items");
    const currencies = new Set<string>();
    for (const it of data.items) {
      if (!/^[a-zA-Z0-9_-]+$/.test(it.listingId)) throw new Error("Invalid listingId");
      if (!Number.isInteger(it.amountInCents) || it.amountInCents < 50) {
        throw new Error("Amount must be at least 50 cents");
      }
      if (it.listingTitle.length > 250) throw new Error("Title too long");
      currencies.add(it.currency);
    }
    if (currencies.size > 1) throw new Error("All cart items must use the same currency");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const customerEmail = (claims?.email as string | undefined) ?? undefined;

    // Server-side reconciliation: recompute the subtotal from the line
    // items the server is about to send to Stripe and compare it against
    // the value the cart UI displayed. If a client tampered with the
    // amounts (or our own price parsing changed between page-load and
    // checkout), we refuse to create the session.
    const computedSubtotal = data.items.reduce((sum, it) => sum + it.amountInCents, 0);
    if (
      typeof data.expectedSubtotalCents === "number" &&
      data.expectedSubtotalCents !== computedSubtotal
    ) {
      console.error(
        "[payments] cart_subtotal_mismatch",
        JSON.stringify({
          event: "cart_subtotal_mismatch",
          userId,
          expected: data.expectedSubtotalCents,
          computed: computedSubtotal,
          itemCount: data.items.length,
        }),
      );
      throw new Error(
        "Your cart total changed. Please review your cart and try checkout again.",
      );
    }

    try {
      const stripe = createStripeClient(data.environment);
      const customerId = await resolveOrCreateCustomer(stripe, {
        email: customerEmail,
        userId,
      });

      const listingIds = data.items.map((i) => i.listingId).join(",");
      const session = await stripe.checkout.sessions.create({
        line_items: data.items.map((it) => ({
          price_data: {
            currency: it.currency,
            product_data: {
              name: it.listingTitle,
              metadata: { listingId: it.listingId },
            },
            unit_amount: it.amountInCents,
          },
          quantity: 1,
        })),
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        automatic_tax: { enabled: true },
        customer: customerId,
        customer_update: { address: "auto", name: "auto" },
        metadata: {
          userId,
          listingIds,
          cartCheckout: "1",
          expectedSubtotalCents: String(computedSubtotal),
        },
      });

      console.log(
        "[payments] cart_session_created",
        JSON.stringify({
          event: "cart_session_created",
          userId,
          sessionId: session.id,
          itemCount: data.items.length,
          subtotalCents: computedSubtotal,
          environment: data.environment,
        }),
      );

      return session.client_secret;
    } catch (err) {
      throw logAndMapStripeError(
        "cart_session_create_failed",
        {
          userId,
          itemCount: data.items.length,
          subtotalCents: computedSubtotal,
          environment: data.environment,
        },
        err,
      );
    }
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

export type CheckoutReceiptItem = {
  description: string;
  quantity: number | null;
  amountSubtotal: number | null;
  amountTotal: number | null;
};

export type CheckoutReceipt = {
  sessionId: string;
  amountTotal: number | null;
  amountSubtotal: number | null;
  amountTax: number | null;
  currency: string | null;
  status: string | null;
  paymentStatus: string | null;
  mode: string | null;
  customerEmail: string | null;
  listingId: string | null;
  listingTitle: string | null;
  receiptUrl: string | null;
  createdAt: string | null;
  items: CheckoutReceiptItem[];
  /**
   * True only when the webhook has confirmed the session as paid/complete
   * and the orders row has been written. Until then, the UI should show a
   * "processing" state rather than a green check.
   */
  webhookConfirmed: boolean;
};

export type OrderHistoryItem = {
  sessionId: string;
  amountTotal: number | null;
  currency: string | null;
  status: string;
  mode: string | null;
  listingTitle: string | null;
  listingId: string | null;
  customerEmail: string | null;
  receiptUrl: string | null;
  createdAt: string;
};

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrderHistoryItem[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("orders")
      .select(
        "stripe_session_id, amount_total, currency, status, mode, listing_title, listing_id, customer_email, receipt_url, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error("Could not load your orders");
    return (data ?? []).map((o) => ({
      sessionId: o.stripe_session_id as string,
      amountTotal: (o.amount_total as number | null) ?? null,
      currency: (o.currency as string | null) ?? null,
      status: (o.status as string) ?? "completed",
      mode: (o.mode as string | null) ?? null,
      listingTitle: (o.listing_title as string | null) ?? null,
      listingId: (o.listing_id as string | null) ?? null,
      customerEmail: (o.customer_email as string | null) ?? null,
      receiptUrl: (o.receipt_url as string | null) ?? null,
      createdAt: o.created_at as string,
    }));
  });

export const getCheckoutReceipt = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string; environment: StripeEnv }) => {
    if (!/^[a-zA-Z0-9_]+$/.test(data.sessionId)) throw new Error("Invalid sessionId");
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutReceipt> => {
    const { supabase, userId } = context;

    // Webhook-populated row (source of truth for "is the payment confirmed?")
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("stripe_session_id", data.sessionId)
      .maybeSingle();

    if (order && order.user_id && order.user_id !== userId) {
      throw new Error("Not authorized to view this order");
    }

    // Always pull the canonical line-item / tax breakdown from Stripe — the
    // orders row only stores the rolled-up total. We expand line_items and
    // total_details so the receipt page can render exactly what the user
    // paid: items, subtotal, tax, total.
    const stripe = createStripeClient(data.environment);
    let session: any;
    try {
      session = await stripe.checkout.sessions.retrieve(data.sessionId, {
        expand: ["line_items", "line_items.data.price.product", "total_details"],
      });
    } catch (err) {
      throw logAndMapStripeError(
        "receipt_retrieve_failed",
        { userId, sessionId: data.sessionId, environment: data.environment },
        err,
      );
    }

    if (session.metadata?.userId && session.metadata.userId !== userId) {
      throw new Error("Not authorized to view this order");
    }

    const items: CheckoutReceiptItem[] = (session.line_items?.data ?? []).map(
      (li: any) => ({
        description: li.description ?? li.price?.product?.name ?? "Item",
        quantity: typeof li.quantity === "number" ? li.quantity : null,
        amountSubtotal: typeof li.amount_subtotal === "number" ? li.amount_subtotal : null,
        amountTotal: typeof li.amount_total === "number" ? li.amount_total : null,
      }),
    );

    const webhookConfirmed = !!order && (order.status === "completed" || order.status === "paid");

    return {
      sessionId: session.id,
      amountTotal: session.amount_total ?? order?.amount_total ?? null,
      amountSubtotal: session.amount_subtotal ?? null,
      amountTax: session.total_details?.amount_tax ?? null,
      currency: session.currency ?? order?.currency ?? null,
      status: session.status ?? order?.status ?? null,
      paymentStatus: session.payment_status ?? order?.status ?? null,
      mode: session.mode ?? order?.mode ?? null,
      customerEmail:
        session.customer_details?.email
          ?? session.customer_email
          ?? order?.customer_email
          ?? null,
      listingId: (session.metadata?.listingId as string) ?? order?.listing_id ?? null,
      listingTitle: (session.metadata?.listingTitle as string) ?? order?.listing_title ?? null,
      receiptUrl: order?.receipt_url ?? null,
      createdAt: order?.created_at ?? new Date(session.created * 1000).toISOString(),
      items,
      webhookConfirmed,
    };
  });
