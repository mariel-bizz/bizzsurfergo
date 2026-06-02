import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Newspaper, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

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
            Setup instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ol className="space-y-2 list-decimal pl-4">
            <li>
              Create a Google Sheet with these column headers (exact names):
              <code className="ml-1 rounded bg-muted px-1 text-foreground">slug</code>
              <code className="ml-1 rounded bg-muted px-1 text-foreground">title</code>
              <code className="ml-1 rounded bg-muted px-1 text-foreground">summary</code>
              <code className="ml-1 rounded bg-muted px-1 text-foreground">source</code>
              <code className="ml-1 rounded bg-muted px-1 text-foreground">source_url</code>
              <code className="ml-1 rounded bg-muted px-1 text-foreground">image_url</code>
              <code className="ml-1 rounded bg-muted px-1 text-foreground">published_at</code>
              <code className="ml-1 rounded bg-muted px-1 text-foreground">category</code>
            </li>
            <li>
              Fill in your news rows. Leave <code className="rounded bg-muted px-1 text-foreground">slug</code> blank and the sync will auto-generate one from the title.
            </li>
            <li>
              Go to <strong>File → Share → Publish to web</strong>. Select your sheet, choose <strong>Comma-separated values (.csv)</strong>, and copy the URL.
            </li>
            <li>
              In your project settings, add a secret named <code className="rounded bg-muted px-1 text-foreground">MARKET_NEWS_CSV_URL</code> with the copied CSV URL as its value.
            </li>
            <li>
              Click <strong>Sync now</strong> above to test. The daily cron job will run automatically at 06:00 UTC.
            </li>
          </ol>

          <div className="rounded-md bg-muted p-3">
            <p className="font-semibold text-foreground">Cron job (run this in the SQL editor after adding the secret):</p>
            <pre className="mt-2 text-xs overflow-x-auto text-foreground whitespace-pre-wrap">
{`SELECT cron.schedule(
  'sync-market-news-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://project--93cf30e3-bdcc-47f4-a14e-e80c68d0be7a.lovable.app/api/public/hooks/sync-market-news',
    headers:='{"Content-Type": "application/json", "apikey": "${process.env.SUPABASE_ANON_KEY ?? "YOUR_ANON_KEY"}"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
