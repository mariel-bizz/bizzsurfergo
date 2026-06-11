import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminGate } from "@/components/AdminGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { listQuotaAudit } from "@/lib/quota-audit.functions";

type Row = {
  userId: string;
  email: string | null;
  tier: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  used: number;
  limit: number | null;
  recentDecisions: Array<{
    decision: string;
    reason: string | null;
    used: number;
    quota_limit: number | null;
    event_id: number | null;
    created_at: string;
  }>;
};

export const Route = createFileRoute("/admin/quota-audit")({
  head: () => ({
    meta: [{ title: "Admin · Quota Audit" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: () => (
    <AdminGate>
      <Page />
    </AdminGate>
  ),
});

function fmt(iso: string) {
  return new Date(iso).toLocaleString();
}

function Page() {
  const fetcher = useServerFn(listQuotaAudit);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { rows } = await fetcher({ data: { limit: 50 } });
      setRows(rows as Row[]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quota Audit</h1>
          <p className="text-sm text-muted-foreground">
            Recent users with enforcement activity — tier, current period, RSVP count, and decisions.
          </p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loading && rows.length === 0 && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="grid gap-3">
        {rows.map((r) => {
          const unlimited = r.limit === null;
          const exhausted = !unlimited && r.used >= (r.limit ?? 0);
          return (
            <Card key={r.userId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                  {exhausted ? (
                    <ShieldAlert className="w-4 h-4 text-destructive" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  )}
                  <span className="truncate">{r.email ?? r.userId}</span>
                  <Badge variant="secondary">{r.tier}</Badge>
                  <Badge variant="outline">{unlimited ? "Unlimited" : `${r.used} / ${r.limit} ${r.period}`}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>
                  Period: <span className="font-mono">{fmt(r.periodStart)}</span> →{" "}
                  <span className="font-mono">{fmt(r.periodEnd)}</span>
                </p>
                {r.recentDecisions.length > 0 && (
                  <div className="border-t pt-2">
                    <p className="font-bold mb-1">Recent decisions</p>
                    <ul className="space-y-1">
                      {r.recentDecisions.map((d, i) => (
                        <li key={i} className="flex items-center gap-2 flex-wrap">
                          <Badge variant={d.decision === "deny" ? "destructive" : "secondary"}>{d.decision}</Badge>
                          {d.reason && <span>{d.reason}</span>}
                          <span>event #{d.event_id}</span>
                          <span>
                            used {d.used}
                            {d.quota_limit !== null ? `/${d.quota_limit}` : ""}
                          </span>
                          <span className="font-mono opacity-70">{fmt(d.created_at)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No enforcement activity yet.</p>
        )}
      </div>
    </main>
  );
}
