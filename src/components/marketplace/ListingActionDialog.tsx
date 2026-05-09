import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Listing } from "@/lib/marketplace-data";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const copyByCategory: Record<
  Listing["category"],
  {
    actionType: "install" | "request" | "download";
    title: (l: Listing) => string;
    description: string;
    submitLabel: string;
    successTitle: string;
    successDesc: string;
    messagePlaceholder: string;
    showMessage: boolean;
  }
> = {
  agents: {
    actionType: "install",
    title: (l) => `Install ${l.title}`,
    description: "Tell us where to install. We'll provision your workspace and email setup steps.",
    submitLabel: "Install agent",
    successTitle: "Install requested",
    successDesc: "Check your inbox for setup instructions.",
    messagePlaceholder: "Anything we should know about your stack? (optional)",
    showMessage: true,
  },
  services: {
    actionType: "request",
    title: (l) => `Request intro — ${l.title}`,
    description: "Share a few details and the provider will reach out within 1 business day.",
    submitLabel: "Request intro",
    successTitle: "Intro requested",
    successDesc: "The provider will contact you shortly.",
    messagePlaceholder: "What outcome are you hoping for? (optional)",
    showMessage: true,
  },
  templates: {
    actionType: "download",
    title: (l) => `Download ${l.title}`,
    description: "We'll email you the download link right away.",
    submitLabel: "Email me the download",
    successTitle: "Download on its way",
    successDesc: "Check your inbox for the file link.",
    messagePlaceholder: "",
    showMessage: false,
  },
};

export function ListingActionDialog({
  listing,
  open,
  onOpenChange,
}: {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const copy = copyByCategory[listing.category];
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", company: "", message: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("marketplace_inquiries").insert({
        listing_id: listing.id,
        listing_title: listing.title,
        listing_category: listing.category,
        action_type: copy.actionType,
        name: values.name,
        email: values.email,
        company: values.company || null,
        message: copy.showMessage ? values.message || null : null,
        user_id: userData.user?.id ?? null,
      });
      if (error) throw error;

      toast.success(copy.successTitle, { description: copy.successDesc });
      form.reset();
      onOpenChange(false);
    } catch (err) {
      console.error("marketplace_inquiry_failed", err);
      toast.error("Something went wrong", {
        description: "Please try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title(listing)}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              autoComplete="name"
              {...form.register("name")}
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
              aria-invalid={!!form.formState.errors.email}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company">
              Company <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="company"
              autoComplete="organization"
              {...form.register("company")}
            />
          </div>

          {copy.showMessage && (
            <div className="space-y-1.5">
              <Label htmlFor="message">
                Notes <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="message"
                rows={3}
                placeholder={copy.messagePlaceholder}
                {...form.register("message")}
              />
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-primary text-primary-foreground font-bold"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {copy.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
