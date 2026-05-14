import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, AlertCircle, Receipt, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-head";
import { listMyOrders } from "@/lib/payments.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/orders")({
  head: () =>
    pageHead({
      path: "/orders",
      title: "Order History — BizzSurfer Go!",
      description: "View your confirmed purchases and receipts.",
      breadcrumbName: "Orders",
    }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: OrdersPage,
});

function formatAmount(cents: number | null, currency: string | null): string {
  if (cents == null || !currency) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function OrdersPage() {
  const fetchOrders = useServerFn(listMyOrders);
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetchOrders(),
  });

  return (
    <div className="min-h-[60vh] max-w-3xl mx-auto px-5 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Order history</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your confirmed purchases. Click an order to view its receipt.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Couldn't load your orders</p>
            <p className="text-xs text-muted-foreground mt-1">Please refresh and try again.</p>
          </div>
        </div>
      )}

      {!isLoading && !error && orders && orders.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <Receipt className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-base font-semibold text-foreground">No orders yet</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Once you complete a purchase, it'll show up here.
          </p>
          <Button asChild variant="outline">
            <Link to="/marketplace">Browse marketplace</Link>
          </Button>
        </div>
      )}

      {orders && orders.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {orders.map((o) => {
            const confirmed = o.status === "completed" || o.status === "paid";
            return (
              <li key={o.sessionId} className="p-4 flex items-center gap-4">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    confirmed ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  {confirmed ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {o.listingTitle ?? "Purchase"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                    <span>{formatDate(o.createdAt)}</span>
                    <span className="capitalize">{o.status}</span>
                    {o.mode === "subscription" && <span>Subscription</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-foreground">
                    {formatAmount(o.amountTotal, o.currency)}
                  </div>
                  <Button
                    asChild
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                  >
                    <Link
                      to="/checkout/return"
                      search={{ session_id: o.sessionId }}
                    >
                      View receipt
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
