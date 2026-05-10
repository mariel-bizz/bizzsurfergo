import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
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

  const fetchClientSecret = async (): Promise<string> => {
    if (!parsed) throw new Error("Listing is not directly payable");
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
    return secret;
  };

  return (
    <div id="marketplace-checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
