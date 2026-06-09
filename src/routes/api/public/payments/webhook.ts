import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { dispatchAlertNotifications } from "@/lib/alert-notify.server";

let _supabase: any = null;
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

function resolvePriceId(item: any): string | undefined {
  return item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
}

const TIER_LABELS: Record<string, string> = {
  hero: "BizzSurfer Go! Hero",
  champion: "BizzSurfer Go! Champion",
  team: "BizzSurfer Team",
  go: "BizzSurfer Go!",
};

function tierFromPriceId(priceId: string | undefined): string | null {
  if (!priceId) return null;
  if (priceId.startsWith("hero_")) return "hero";
  if (priceId.startsWith("champion_")) return "champion";
  if (priceId.startsWith("team_")) return "team";
  if (priceId.startsWith("go_")) return "go";
  return null;
}

function billingFromPriceId(priceId: string | undefined): "monthly" | "yearly" | null {
  if (!priceId) return null;
  if (priceId.endsWith("_yearly")) return "yearly";
  if (priceId.endsWith("_monthly")) return "monthly";
  return null;
}

function formatAmount(cents: number | null | undefined, currency: string | null | undefined): string {
  if (cents == null || !currency) return "";
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

/**
 * Insert an admin_alerts row AND dispatch through configured channels
 * (slack/webhook/email). Used when a subscription event lands without the
 * data the rest of the app depends on (tier_id, quantity, userId).
 */
async function raiseAdminAlert(payload: {
  kind: string;
  severity: "warning" | "critical";
  title: string;
  message: string;
  metadata: Record<string, unknown>;
}) {
  try {
    await getSupabase().from("admin_alerts").insert({
      kind: payload.kind,
      severity: payload.severity,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata,
    });
  } catch (e) {
    console.error("[webhook] admin_alerts insert failed", e);
  }
  try {
    await dispatchAlertNotifications(payload);
  } catch (e) {
    console.error("[webhook] alert dispatch failed", e);
  }
}

async function enqueueConfirmationEmail(opts: {
  email: string;
  name?: string | null;
  tierId: string | null;
  billingPeriod: "monthly" | "yearly" | null;
  quantity: number;
  amountFormatted: string;
  subscriptionId: string;
}) {
  if (!opts.email) return;
  const tierLabel = (opts.tierId && TIER_LABELS[opts.tierId]) || "BizzSurfer Go!";
  try {
    await getSupabase().rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        template_name: "checkout-confirmation",
        recipient_email: opts.email,
        idempotency_key: `checkout-confirm-${opts.subscriptionId}`,
        template_data: {
          name: opts.name ?? "",
          tierLabel,
          billingPeriod: opts.billingPeriod,
          quantity: opts.quantity,
          amountFormatted: opts.amountFormatted,
          manageUrl: "https://go.bizzsurfer.ai/profile",
        },
      },
    });
  } catch (e) {
    console.error("[webhook] enqueue confirmation email failed", e);
  }
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item);
  const productId = item?.price?.product;
  const quantity = item?.quantity ?? 1;
  const tierId = tierFromPriceId(priceId);
  const billingPeriod = billingFromPriceId(priceId);
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  // Alert when the webhook can't link the subscription to a user, or when
  // tier_id / quantity didn't resolve — both make the rest of the app
  // unable to gate features correctly.
  if (!userId) {
    await raiseAdminAlert({
      kind: "webhook_missing_user",
      severity: "critical",
      title: "Stripe subscription created without userId",
      message: "Subscription event arrived but metadata.userId was missing — cannot link to a profile.",
      metadata: { stripe_subscription_id: subscription.id, customer: subscription.customer, env, price_id: priceId },
    });
    return;
  }
  if (!tierId || !quantity) {
    await raiseAdminAlert({
      kind: "webhook_missing_tier_or_qty",
      severity: "warning",
      title: "Subscription written without tier_id or quantity",
      message: `Resolved tier_id=${tierId ?? "null"}, quantity=${quantity ?? "null"} for price ${priceId ?? "unknown"}.`,
      metadata: { stripe_subscription_id: subscription.id, user_id: userId, price_id: priceId, env },
    });
  }

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      tier_id: tierId,
      quantity,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  // Branded confirmation/receipt email.
  const customer = subscription.customer_email
    ?? subscription.customer_details?.email
    ?? null;
  let email: string | null = customer;
  let name: string | null = subscription.customer_details?.name ?? null;
  if (!email && typeof subscription.customer === "string") {
    try {
      const { data } = await getSupabase().auth.admin.getUserById(userId);
      email = data?.user?.email ?? null;
      name = name ?? (data?.user?.user_metadata?.full_name as string | undefined) ?? null;
    } catch (e) {
      console.error("[webhook] could not look up user email", e);
    }
  }
  if (email) {
    const unitAmount = item?.price?.unit_amount ?? null;
    const currency = item?.price?.currency ?? subscription.currency ?? null;
    const total = unitAmount != null ? unitAmount * quantity : null;
    await enqueueConfirmationEmail({
      email,
      name,
      tierId,
      billingPeriod,
      quantity,
      amountFormatted: formatAmount(total, currency),
      subscriptionId: subscription.id,
    });
  }
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item);
  const productId = item?.price?.product;
  const quantity = item?.quantity ?? 1;
  const tierId = tierFromPriceId(priceId);
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  // Compare against the prior row so we can alert on missing data AND so
  // we can log portal-driven plan changes for analytics.
  const { data: prior } = await getSupabase()
    .from("subscriptions")
    .select("tier_id, price_id, quantity")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (!tierId || !quantity) {
    await raiseAdminAlert({
      kind: "webhook_missing_tier_or_qty",
      severity: "warning",
      title: "Subscription update missing tier_id or quantity",
      message: `Resolved tier_id=${tierId ?? "null"}, quantity=${quantity ?? "null"} for price ${priceId ?? "unknown"}.`,
      metadata: { stripe_subscription_id: subscription.id, price_id: priceId, env },
    });
  }

  await getSupabase()
    .from("subscriptions")
    .update({
      status: subscription.status,
      product_id: productId,
      price_id: priceId,
      tier_id: tierId,
      quantity,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  // Portal change diagnostics: write a structured admin_alerts entry only
  // when the plan actually changed (different tier, different price, or
  // seat count changed). Severity 'warning' so it doesn't page on normal
  // operations but is visible in the admin alerts feed for analytics.
  const priorTier = (prior?.tier_id as string | null) ?? null;
  const priorQty = (prior?.quantity as number | null) ?? null;
  const priorPrice = (prior?.price_id as string | null) ?? null;
  if (prior && (priorTier !== tierId || priorPrice !== priceId || priorQty !== quantity)) {
    const direction =
      priorTier && tierId && priorTier !== tierId
        ? tierRank(tierId) > tierRank(priorTier) ? "upgrade" : "downgrade"
        : priorPrice !== priceId
        ? "billing_period_change"
        : (priorQty ?? 0) < (quantity ?? 0)
        ? "seats_increase"
        : "seats_decrease";
    try {
      await getSupabase().from("admin_alerts").insert({
        kind: "subscription_changed",
        severity: "warning",
        title: `Subscription ${direction.replace(/_/g, " ")}`,
        message: `${priorTier ?? "?"}→${tierId ?? "?"}, price ${priorPrice ?? "?"}→${priceId ?? "?"}, seats ${priorQty ?? "?"}→${quantity ?? "?"}.`,
        metadata: {
          direction,
          stripe_subscription_id: subscription.id,
          prior: { tier_id: priorTier, price_id: priorPrice, quantity: priorQty },
          next: { tier_id: tierId, price_id: priceId, quantity },
          env,
        },
      });
    } catch (e) {
      console.error("[webhook] subscription_changed log failed", e);
    }
  }
}

function tierRank(t: string | null): number {
  if (!t) return 0;
  const ranks: Record<string, number> = { go: 0, hero: 1, champion: 2, team: 3 };
  return ranks[t] ?? 0;
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId ?? null;
  const listingId = session.metadata?.listingId ?? null;
  await getSupabase().from("orders").upsert(
    {
      user_id: userId,
      listing_id: listingId,
      listing_title: session.metadata?.listingTitle ?? null,
      stripe_session_id: session.id,
      stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
      stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
      stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null,
      amount_total: session.amount_total ?? null,
      currency: session.currency ?? null,
      status: session.payment_status === "paid" || session.status === "complete" ? "completed" : (session.payment_status ?? session.status ?? "pending"),
      mode: session.mode ?? null,
      customer_email: session.customer_details?.email ?? session.customer_email ?? null,
      environment: env,
      metadata: session.metadata ?? {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_session_id" },
  );
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await handleCheckoutCompleted(event.data.object, env);
      break;
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object, env);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          // Surface unexpected handler failures as a critical admin alert
          // so silent processing breakage doesn't go unnoticed.
          try {
            await raiseAdminAlert({
              kind: "webhook_handler_error",
              severity: "critical",
              title: "Stripe webhook handler threw",
              message: (e as Error)?.message ?? String(e),
              metadata: { env: rawEnv },
            });
          } catch {}
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
