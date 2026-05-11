import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-head";
import { getCheckoutReceipt } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { removeFromCart } from "@/lib/marketplace-cart";

export const Route = createFileRoute("/checkout/return")({
  head: () =>
    pageHead({
      path: "/checkout/return",
      title: "Payment Confirmation",
      description: "Your order receipt and payment confirmation.",
      breadcrumbName: "Checkout",
    }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
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
  const { session_id } = Route.useSearch();
  const fetchReceipt = useServerFn(getCheckoutReceipt);

  const { data, isLoading, error } = useQuery({
    queryKey: ["checkout-receipt", session_id],
    queryFn: () =>
      fetchReceipt({ data: { sessionId: session_id!, environment: getStripeEnvironment() } }),
    enabled: !!session_id,
    retry: 2,
    retryDelay: 1500,
  });

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

  const isPaid = data.paymentStatus === "paid" || data.status === "complete" || data.status === "completed";

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-5 py-10">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isPaid ? "Payment confirmed" : "Payment processing"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPaid
              ? "Thank you for your purchase. A receipt has been sent to your email."
              : "Your payment is still being processed. We'll email you once it's complete."}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Receipt</h2>
          <dl className="space-y-2 text-sm">
            {data.listingTitle && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Item</dt>
                <dd className="text-foreground text-right">{data.listingTitle}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="text-foreground font-medium">
                {formatAmount(data.amountTotal, data.currency)}
                {data.mode === "subscription" && (
                  <span className="text-muted-foreground"> /mo</span>
                )}
              </dd>
            </div>
            {data.customerEmail && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="text-foreground">{data.customerEmail}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-foreground capitalize">{isPaid ? "Paid" : data.paymentStatus ?? data.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Order ID</dt>
              <dd className="text-foreground font-mono text-xs break-all">{data.sessionId}</dd>
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
