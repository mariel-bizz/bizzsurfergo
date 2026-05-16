import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type StatusRow = {
  status: "pending" | "approved" | "rejected";
  title: string;
  offering_type: string;
  created_at: string;
  updated_at: string;
  review_notes: string | null;
  reviewed_at: string | null;
};

export const Route = createFileRoute("/marketplace/application/$token")({
  head: () => ({
    meta: [
      { title: "Application status — BizzSurfer Go!" },
      { name: "description", content: "Track the status of your marketplace listing application." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ApplicationStatusPage,
});

function ApplicationStatusPage() {
  const { token } = Route.useParams();
  const [row, setRow] = useState<StatusRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.rpc(
        "get_listing_application_status",
        { _token: token },
      );
      if (cancelled) return;
      if (error) {
        setError("We couldn't load this application.");
      } else if (!data || (Array.isArray(data) && data.length === 0)) {
        setError("Application not found. Check your link or contact info@bizzsurfer.com.");
      } else {
        const r = Array.isArray(data) ? data[0] : data;
        setRow(r as StatusRow);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/marketplace">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to marketplace
        </Link>
      </Button>

      <Card className="border border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">
            Marketplace listing application
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading status…
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : row ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={row.status} />
                <span className="text-sm text-muted-foreground">
                  Submitted {new Date(row.created_at).toLocaleDateString()}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Offering
                </p>
                <h2 className="text-lg font-bold mt-1">{row.title}</h2>
                <p className="text-sm text-muted-foreground">{row.offering_type}</p>
              </div>

              <StatusExplainer status={row.status} reviewedAt={row.reviewed_at} />

              {row.review_notes ? (
                <div className="rounded-xl bg-muted/50 border border-border p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Reviewer notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{row.review_notes}</p>
                </div>
              ) : null}

              <p className="text-xs text-muted-foreground border-t border-border pt-4">
                Questions? Reply to your confirmation email or contact{" "}
                <a
                  href="mailto:info@bizzsurfer.com"
                  className="text-primary font-semibold"
                >
                  info@bizzsurfer.com
                </a>
                .
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}

function StatusBadge({ status }: { status: StatusRow["status"] }) {
  if (status === "approved") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approved
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border border-rose-200">
        <XCircle className="w-3.5 h-3.5 mr-1" /> Not approved
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200">
      <Clock className="w-3.5 h-3.5 mr-1" /> Pending review
    </Badge>
  );
}

function StatusExplainer({
  status,
  reviewedAt,
}: {
  status: StatusRow["status"];
  reviewedAt: string | null;
}) {
  if (status === "pending") {
    return (
      <p className="text-sm">
        Your application is in our review queue. We typically respond within
        3–5 business days.
      </p>
    );
  }
  if (status === "approved") {
    return (
      <p className="text-sm">
        Congratulations — your application was approved
        {reviewedAt
          ? ` on ${new Date(reviewedAt).toLocaleDateString()}`
          : ""}
        . Our team will be in touch with onboarding details shortly.
      </p>
    );
  }
  return (
    <p className="text-sm">
      Unfortunately your application wasn't approved at this time
      {reviewedAt ? ` (reviewed ${new Date(reviewedAt).toLocaleDateString()})` : ""}.
      You're welcome to refine and resubmit.
    </p>
  );
}
