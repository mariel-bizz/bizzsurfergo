import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShoppingCart, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-head";
import { useCart, cartTotalDisplay } from "@/lib/marketplace-cart";
import { parseListingPrice } from "@/lib/marketplace-data";
import { MarketplaceCartCheckout } from "@/components/marketplace/MarketplaceCartCheckout";

export const Route = createFileRoute("/marketplace/checkout")({
  head: () =>
    pageHead({
      path: "/marketplace/checkout",
      title: "Checkout — Agentic AI",
      description: "Pay for the items in your cart in one go.",
      breadcrumbName: "Checkout",
    }),
  component: MarketplaceCheckoutPage,
});

function MarketplaceCheckoutPage() {
  const { listings } = useCart();
  const navigate = useNavigate();

  const payable = listings.filter((l) => {
    const p = parseListingPrice(l.price);
    return p && !p.interval;
  });
  const skipped = listings.filter((l) => !payable.includes(l));

  if (listings.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-5">
        <div className="text-center space-y-4 max-w-sm">
          <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Your cart is empty</h1>
          <Button asChild>
            <Link to="/">Browse Agentic AI</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (payable.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-5">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Nothing to pay yet</h1>
          <p className="text-sm text-muted-foreground">
            All cart items are quote-only or subscriptions. Open each listing to
            request a quote or start a subscription individually.
          </p>
          <Button variant="outline" onClick={() => navigate({ to: "/" })}>
            Back to marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-8 space-y-6">
      <button
        onClick={() => navigate({ to: "/" })}
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
        <p className="text-sm text-muted-foreground">
          Paying for {payable.length} item{payable.length === 1 ? "" : "s"} —{" "}
          subtotal {cartTotalDisplay(payable)}.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        {payable.map((l) => (
          <div key={l.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-bold text-foreground truncate">{l.title}</span>
            <span className="text-foreground shrink-0">{l.price}</span>
          </div>
        ))}
        {skipped.length > 0 && (
          <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">
            Skipped (quote-only or subscription):{" "}
            {skipped.map((s) => s.title).join(", ")}. Check out individually
            from each listing.
          </p>
        )}
        <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">
          Any applicable VAT or sales tax is calculated and shown in the
          payment step below before you confirm.
        </p>
      </div>

      <MarketplaceCartCheckout listings={payable} />
    </div>
  );
}
