import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Newspaper, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/market-news")({
  head: () => ({
    meta: [
      { title: "Market News Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AdminGate>
      <MarketNewsAdminPage />
    </AdminGate>
  ),
});

type SyncResult = {
  ok: boolean;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
};

function MarketNewsAdminPage() {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/public/hooks/sync-market-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = (await res.json().catch(() => ({}))) as Partial<SyncResult> & { error?: string };
      if (!res.ok) {
        toast.error(json.error ?? `Sync failed (${res.status})`);
        setLastResult({ ok: false, inserted: 0, updated: 0, skipped: 0, errors: [json.error ?? `HTTP ${res.status}`] });
      } else {
        const result: SyncResult = {
          ok: true,
          inserted: json.inserted ?? 0,
          updated: json.updated ?? 0,
          skipped: json.skipped ?? 0,
          errors: Array.isArray(json.errors) ? json.errors : [],
        };
        setLastResult(result);
        toast.success("Sync completed", {
          description: `${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(msg);
      setLastResult({ ok: false, inserted: 0, updated: 0, skipped: 0, errors: [msg] });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Market News Admin</h1>
          <p className="text-sm text-muted-foreground">
            Sync news from your Google Sheet CSV into the database.
          </p>
        </div>
        <Button size="sm" onClick={triggerSync} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync now"}
        </Button>
      </div>

      {lastResult && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {lastResult.ok ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-destructive" />
              )}
              <CardTitle className="text-base">
                {lastResult.ok ? "Last sync succeeded" : "Last sync failed"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Inserted: {lastResult.inserted}</Badge>
              <Badge variant="secondary">Updated: {lastResult.updated}</Badge>
              <Badge variant="outline">Skipped: {lastResult.skipped}</Badge>
            </div>
            {lastResult.errors.length > 0 && (
              <div className="rounded-md bg-destructive/10 p-3 space-y-1">
                <p className="text-sm font-semibold text-destructive">Errors:</p>
                <ul className="text-sm text-destructive space-y-0.5">
                  {lastResult.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper className="w-4 h-4" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            News is imported from the connected Google Sheet (columns:{" "}
            <code className="rounded bg-muted px-1 text-foreground">slug</code>,{" "}
            <code className="rounded bg-muted px-1 text-foreground">title</code>,{" "}
            <code className="rounded bg-muted px-1 text-foreground">summary</code>,{" "}
            <code className="rounded bg-muted px-1 text-foreground">source</code>,{" "}
            <code className="rounded bg-muted px-1 text-foreground">source_url</code>,{" "}
            <code className="rounded bg-muted px-1 text-foreground">image_url</code>,{" "}
            <code className="rounded bg-muted px-1 text-foreground">published_at</code>,{" "}
            <code className="rounded bg-muted px-1 text-foreground">category</code>).
            Leave <code className="rounded bg-muted px-1 text-foreground">slug</code> blank to auto-generate it from the title.
          </p>
          <p>
            An automated job runs <strong>every day at 06:00 UTC</strong> and refreshes the news list. Use <strong>Sync now</strong> above to trigger an immediate refresh.
          </p>
        </CardContent>
      </Card>

    </main>
  );
}
