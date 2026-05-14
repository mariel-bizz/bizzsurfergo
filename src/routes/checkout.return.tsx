import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-head";
import { getCheckoutReceipt, type CheckoutReceipt } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { removeFromCart, clearCart } from "@/lib/marketplace-cart";

export const Route = createFileRoute("/checkout/return")({
  head: () =>
    pageHead({
      path: "/checkout/return",
      title: "Payment Confirmation",
      description: "Your order receipt and payment confirmation.",
      breadcrumbName: "Checkout",
    }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string; clear_cart?: number } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
    clear_cart: search.clear_cart === 1 || search.clear_cart === "1" ? 1 : undefined,
  }),
  component: CheckoutReturn,
});

function formatAmount(cents: number | null, currency: string | null): string {
  if (cents == null || !currency) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function CheckoutReturn() {
  const { session_id, clear_cart } = Route.useSearch();
  const fetchReceipt = useServerFn(getCheckoutReceipt);

  const { data, isLoading, error } = useQuery({
    queryKey: ["checkout-receipt", session_id],
    queryFn: () =>
      fetchReceipt({ data: { sessionId: session_id!, environment: getStripeEnvironment() } }),
    enabled: !!session_id,
    retry: 2,
    retryDelay: 1500,
    // Poll until the webhook has written the orders row, so the receipt
    // page can show a confirmed status (and not just "Stripe says paid").
    refetchInterval: (q) =>
      (q.state.data as { webhookConfirmed?: boolean } | undefined)?.webhookConfirmed
        ? false
        : 2500,
  });

  // After a successful purchase, remove the item(s) from the local cart.
  useEffect(() => {
    if (clear_cart) {
      clearCart();
      return;
    }
    const listingId = (data as { listingId?: string } | undefined)?.listingId;
    if (listingId) removeFromCart(listingId);
  }, [data, clear_cart]);

  if (!session_id) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-5">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">No session information found</h1>
          <Button asChild variant="outline">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-5">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Confirming your payment…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-5">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
          <h1 className="text-xl font-semibold text-foreground">Could not load your receipt</h1>
          <p className="text-sm text-muted-foreground">
            Your payment may still have succeeded. Please check your email or contact support.
          </p>
          <Button asChild variant="outline">
            <Link to="/profile">Go to Profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stripeSaysPaid =
    data.paymentStatus === "paid" || data.status === "complete" || data.status === "completed";
  const confirmed = data.webhookConfirmed && stripeSaysPaid;
  const processing = stripeSaysPaid && !data.webhookConfirmed;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-5 py-10">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-3">
          <div
            className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${
              confirmed ? "bg-primary/10" : "bg-muted"
            }`}
          >
            {confirmed ? (
              <CheckCircle2 className="w-8 h-8 text-primary" />
            ) : (
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {confirmed
              ? "Payment confirmed"
              : processing
              ? "Confirming your payment…"
              : "Payment processing"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {confirmed
              ? "Thank you for your purchase. A receipt has been sent to your email."
              : processing
              ? "Stripe accepted your payment. Waiting for our system to finalise the order — this usually takes a few seconds."
              : "Your payment is still being processed. We'll email you once it's complete."}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Order summary</h2>

          {data.items.length > 0 ? (
            <ul className="divide-y divide-border text-sm">
              {data.items.map((item, idx) => (
                <li key={idx} className="py-2 flex justify-between gap-4">
                  <span className="text-foreground">
                    {item.description}
                    {item.quantity && item.quantity > 1 ? (
                      <span className="text-muted-foreground"> × {item.quantity}</span>
                    ) : null}
                  </span>
                  <span className="text-foreground shrink-0">
                    {formatAmount(item.amountTotal ?? item.amountSubtotal, data.currency)}
                  </span>
                </li>
              ))}
            </ul>
          ) : data.listingTitle ? (
            <div className="text-sm text-foreground">{data.listingTitle}</div>
          ) : null}

          <dl className="space-y-1.5 text-sm pt-3 border-t border-border">
            {data.amountSubtotal != null && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="text-foreground">
                  {formatAmount(data.amountSubtotal, data.currency)}
                </dd>
              </div>
            )}
            {data.amountTax != null && data.amountTax > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Tax</dt>
                <dd className="text-foreground">
                  {formatAmount(data.amountTax, data.currency)}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4 pt-1.5 border-t border-border">
              <dt className="font-bold text-foreground">Total</dt>
              <dd className="font-bold text-foreground">
                {formatAmount(data.amountTotal, data.currency)}
                {data.mode === "subscription" && (
                  <span className="text-muted-foreground font-normal"> /mo</span>
                )}
              </dd>
            </div>
          </dl>

          <dl className="space-y-1.5 text-xs pt-3 border-t border-border">
            {data.customerEmail && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="text-foreground">{data.customerEmail}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-foreground capitalize">
                {confirmed
                  ? "Paid · confirmed"
                  : processing
                  ? "Paid · awaiting confirmation"
                  : data.paymentStatus ?? data.status ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Order ID</dt>
              <dd className="text-foreground font-mono break-all">{data.sessionId}</dd>
            </div>
          </dl>
        </div>

        <div className="flex gap-2 justify-center">
          <Button asChild className="bg-gradient-primary text-primary-foreground">
            <Link to="/profile">Go to Profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
