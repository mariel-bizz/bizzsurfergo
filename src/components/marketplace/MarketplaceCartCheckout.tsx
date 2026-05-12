import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createMarketplaceCartCheckout } from "@/lib/payments.functions";
import { parseListingPrice, type Listing } from "@/lib/marketplace-data";

interface Props {
  listings: Listing[];
  returnUrl?: string;
}

export function MarketplaceCartCheckout({ listings, returnUrl }: Props) {
  const fetchClientSecret = async (): Promise<string> => {
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
    if (items.length === 0) throw new Error("No payable items in cart");

    const secret = await createMarketplaceCartCheckout({
      data: {
        items,
        returnUrl: returnUrl || `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}&clear_cart=1`,
        environment: getStripeEnvironment(),
      },
    });
    if (!secret) throw new Error("No client secret returned");
    return secret;
  };

  return (
    <div id="marketplace-cart-checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
