import { useEffect, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createNewsPassCheckout } from "@/lib/news-pass.functions";
import { Heart, ShieldCheck } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where Stripe should send the user after success — must include `news_pass_session={CHECKOUT_SESSION_ID}`. */
  returnUrl: string;
}

export function NewsPassCheckoutDialog({ open, onOpenChange, returnUrl }: Props) {
  // Re-mount checkout each open so a stale clientSecret can't be reused.
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (open) setKey((k) => k + 1);
  }, [open]);

  const fetchClientSecret = async (): Promise<string> => {
    const secret = await createNewsPassCheckout({
      data: { returnUrl, environment: getStripeEnvironment() },
    });
    if (!secret) throw new Error("No client secret returned");
    return secret;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Heart className="w-5 h-5 text-[#ff6f00]" />
            Unlock 24h of BizzSurfer News for €1
          </DialogTitle>
          <DialogDescription className="text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% goes to children IT-skills programs · Secure payment by Stripe
          </DialogDescription>
        </DialogHeader>
        <div id="news-pass-checkout" className="px-2 pb-2 max-h-[70vh] overflow-y-auto">
          {open && (
            <EmbeddedCheckoutProvider
              key={key}
              stripe={getStripe()}
              options={{ fetchClientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
