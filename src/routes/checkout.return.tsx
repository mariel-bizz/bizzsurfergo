import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/checkout/return")({
  head: () =>
    pageHead({
      path: "/checkout/return",
      title: "Welcome to BizzSurfer Go!",
      description: "Your subscription is being activated.",
      breadcrumbName: "Checkout",
    }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-5">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Payment received</h1>
        <p className="text-sm text-muted-foreground">
          {session_id
            ? "Your subscription is being activated. Premium features will unlock momentarily."
            : "No session information found."}
        </p>
        <div className="flex gap-2 justify-center">
          <Button asChild className="bg-gradient-primary text-primary-foreground">
            <Link to="/profile">Go to Profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
