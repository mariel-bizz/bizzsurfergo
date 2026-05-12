import { Link } from "@tanstack/react-router";
import { ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { categoryMeta } from "@/lib/marketplace-data";
import { cartTotalDisplay, removeFromCart, useCart, clearCart } from "@/lib/marketplace-cart";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MarketplaceCartSheet({ open, onOpenChange }: Props) {
  const { listings } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Your cart
          </SheetTitle>
          <SheetDescription>
            Review the agents, services and templates you've added before
            checking out.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 space-y-3">
          {listings.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              <p className="text-xs text-muted-foreground">
                Browse the marketplace and tap “Add to cart” on any listing.
              </p>
            </div>
          ) : (
            listings.map((l) => {
              const Icon = categoryMeta[l.category].icon;
              return (
                <div
                  key={l.id}
                  className="flex gap-3 rounded-2xl bg-card border border-border p-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground line-clamp-2 break-words">
                      {l.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      by {l.provider}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {l.price}
                      </span>
                      <button
                        onClick={() => removeFromCart(l.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive hover:underline"
                        aria-label={`Remove ${l.title} from cart`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {listings.length > 0 && (
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Subtotal
              </span>
              <span className="text-base font-bold text-foreground">
                {cartTotalDisplay(listings)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Quote-only items (e.g. “Custom”) are paid via intro requests on
              their detail page.
            </p>
            <div className="space-y-2">
              <Link
                to="/marketplace/checkout"
                onClick={() => onOpenChange(false)}
                className="flex items-center justify-between gap-2 rounded-xl bg-gradient-primary text-primary-foreground px-4 py-3 text-sm font-bold shadow-soft hover:shadow-elegant transition"
              >
                <span>Checkout all items</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => clearCart()}
              >
                Clear cart
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
