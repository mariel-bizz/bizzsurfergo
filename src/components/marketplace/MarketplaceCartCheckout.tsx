import { useCallback, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createMarketplaceCartCheckout } from "@/lib/payments.functions";
import { parseListingPrice, type Listing } from "@/lib/marketplace-data";

interface Props {
  listings: Listing[];
  returnUrl?: string;
}

export function MarketplaceCartCheckout({ listings, returnUrl }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const items = listings
      .map((l) => {
        const parsed = parseListingPrice(l.price);
        if (!parsed || parsed.interval) return null;
        return {
          listingId: l.id,
          listingTitle: l.title,
          amountInCents: parsed.amountInCents,
          currency: parsed.currency,
        };
      })
      .filter((x): x is NonNullable<typeof x> => !!x);
    if (items.length === 0) {
      const msg = "No payable items in cart";
      setError(msg);
      throw new Error(msg);
    }

    const expectedSubtotalCents = items.reduce((s, it) => s + it.amountInCents, 0);

    try {
      const secret = await createMarketplaceCartCheckout({
        data: {
          items,
          expectedSubtotalCents,
          returnUrl:
            returnUrl ||
            `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}&clear_cart=1`,
          environment: getStripeEnvironment(),
        },
      });
      if (!secret) throw new Error("No client secret returned");
      setError(null);
      return secret;
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "We couldn't start your checkout session. Please try again.";
      console.error("[MarketplaceCartCheckout] createMarketplaceCartCheckout failed:", e);
      setError(message);
      throw e instanceof Error ? e : new Error(message);
    }
  }, [listings, returnUrl]);

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
        <h3 className="text-sm font-bold text-foreground">Checkout couldn't start</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">{error}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setError(null);
            setAttempt((n) => n + 1);
          }}
        >
          <RefreshCw className="w-4 h-4 mr-1.5" /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div id="marketplace-cart-checkout">
      <EmbeddedCheckoutProvider
        key={attempt}
        stripe={getStripe()}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
