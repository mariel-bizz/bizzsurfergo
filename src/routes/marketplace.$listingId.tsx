import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, CreditCard, Download, Loader2, Plus, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-head";
import { categoryMeta, getListing, getPriceType, parseListingPrice, type Listing } from "@/lib/marketplace-data";
import { addToCart, useCart } from "@/lib/marketplace-cart";
import { ListingActionDialog } from "@/components/marketplace/ListingActionDialog";
import { MarketplaceCheckout } from "@/components/marketplace/MarketplaceCheckout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useGame } from "@/components/AppShell";

export const Route = createFileRoute("/marketplace/$listingId")({
  validateSearch: (s: Record<string, unknown>) => ({
    checkout: s.checkout === 1 || s.checkout === "1" ? 1 : undefined,
  }),
  loader: ({ params }) => {
    const listing = getListing(params.listingId);
    if (!listing) throw notFound();
    return { listing };
  },
  head: ({ loaderData }) => {
    const l = loaderData?.listing;
    const base = pageHead({
      path: `/marketplace/${l?.id ?? ""}`,
      title: l ? `${l.title} — Marketplace` : "Listing — Marketplace",
      description: l?.tagline ?? "Marketplace listing on BizzSurfer Go!",
      breadcrumbName: l?.title ?? "Listing",
    });
    if (!l) return base;
    const parsed = parseListingPrice(l.price);
    const product: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: l.title,
      description: l.tagline,
      brand: { "@type": "Brand", name: l.provider },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: l.rating,
        ratingCount: 1,
        bestRating: 5,
      },
    };
    if (parsed) {
      product.offers = {
        "@type": "Offer",
        price: (parsed.amountInCents / 100).toFixed(2),
        priceCurrency: (parsed.currency || "EUR").toUpperCase(),
        availability: "https://schema.org/InStock",
      };
    }
    return {
      ...base,
      scripts: [
        ...(base.scripts ?? []),
        { type: "application/ld+json", children: JSON.stringify(product) },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="px-5 py-10 text-center space-y-3">
      <h1 className="text-xl font-bold text-foreground">Listing not found</h1>
      <p className="text-sm text-muted-foreground">
        That marketplace item doesn't exist or has been removed.
      </p>
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-1 text-sm font-bold text-primary"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="px-5 py-10 text-center text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
  component: ListingDetail,
});

function ListingDetail() {
  const { listing } = Route.useLoaderData() as { listing: Listing };
  const meta = categoryMeta[listing.category];
  const Icon = meta.icon;
  const { listings: cartListings } = useCart();
  const inCart = cartListings.some((c) => c.id === listing.id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const game = useGame();
  useEffect(() => { game.completeOnboardingStep("marketplace"); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddToCart = () => {
    if (inCart) return;
    if (addToCart(listing.id)) {
      toast.success(`Added “${listing.title}” to cart`);
    }
  };

  const handlePrimaryAction = () => {
    setDialogOpen(true);
  };

  const ActionIcon = isDownload ? Download : ArrowRight;
  const ctaLabel = listing.cta;
  const isDownload = listing.category === "templates";

  return (
    <div className="px-5 py-5 space-y-5">
      {isPayable && <PaymentTestModeBanner />}

      <Link
        to="/marketplace"
        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Marketplace
      </Link>

      <header className="rounded-3xl bg-card border border-border shadow-card p-5">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {meta.label}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-muted-foreground">
                <Star className="w-3 h-3 fill-current text-amber-500" />
                {listing.rating.toFixed(1)}
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold text-foreground">
              {listing.title}
            </h1>
            <p className="text-xs text-muted-foreground">by {listing.provider}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-foreground/90">{listing.tagline}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {listing.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </header>

      <section className="rounded-3xl bg-card border border-border shadow-card p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Description
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">
          {listing.description}
        </p>
      </section>

      <section className="rounded-3xl bg-card border border-border shadow-card p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Requirements
        </h2>
        <ul className="mt-3 space-y-2">
          {listing.requirements.map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm text-foreground/90">
              <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="sticky bottom-4 rounded-3xl bg-gradient-deep p-4 text-primary-foreground shadow-elegant flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
            {isPayable ? (parsedPrice.interval === "month" ? "Monthly" : "Price") : "Price"}
          </p>
          <p className="text-base font-bold text-white truncate">{listing.price}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cartable && (
            <Button
              onClick={handleAddToCart}
              disabled={inCart}
              variant="outline"
              className="h-11 px-3 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white font-bold disabled:opacity-70"
            >
              {inCart ? <ShoppingCart className="w-4 h-4 mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
              {inCart ? "In cart" : "Add to cart"}
            </Button>
          )}
          <Button
            onClick={handlePrimaryAction}
            className="h-11 px-5 bg-white text-primary hover:bg-white/90 font-bold"
          >
            <ActionIcon className="w-4 h-4 mr-1.5" />
            {ctaLabel}
          </Button>
        </div>
      </div>

      <ListingActionDialog
        listing={listing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {isPayable && (
        <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
          <DialogContent className="max-w-lg p-0 overflow-hidden">
            <DialogHeader className="px-5 pt-5">
              <DialogTitle>Complete your order</DialogTitle>
              <DialogDescription>
                {listing.title} — {parsedPrice.display}
              </DialogDescription>
            </DialogHeader>
            <div className="p-2 min-h-[500px]">
              {checkoutOpen ? (
                <MarketplaceCheckout
                  listing={listing}
                  returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
                />
              ) : (
                <div className="flex items-center justify-center h-[500px]">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

