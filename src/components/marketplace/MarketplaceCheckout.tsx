import { useCallback, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createMarketplaceListingCheckout } from "@/lib/payments.functions";
import type { Listing } from "@/lib/marketplace-data";
import { parseListingPrice } from "@/lib/marketplace-data";

interface Props {
  listing: Listing;
  returnUrl?: string;
}

export function MarketplaceCheckout({ listing, returnUrl }: Props) {
  const parsed = parseListingPrice(listing.price);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    if (!parsed) {
      const msg = "This listing isn't directly payable. Request a quote instead.";
      setError(msg);
      throw new Error(msg);
    }
    try {
      const secret = await createMarketplaceListingCheckout({
        data: {
          listingId: listing.id,
          listingTitle: listing.title,
          amountInCents: parsed.amountInCents,
          currency: parsed.currency,
          interval: parsed.interval,
          returnUrl: returnUrl || window.location.href,
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
      console.error("[MarketplaceCheckout] createMarketplaceListingCheckout failed:", e);
      setError(message);
      throw e instanceof Error ? e : new Error(message);
    }
  }, [parsed, listing.id, listing.title, returnUrl]);

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
    <div id="marketplace-checkout">
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
