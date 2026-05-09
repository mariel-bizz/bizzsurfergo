import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Alert = {
  id: string;
  kind: string;
  severity: string;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  acknowledged_at: string | null;
  created_at: string;
};

export const Route = createFileRoute("/admin/alerts")({
  head: () => ({
    meta: [
      { title: "Admin Alerts" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AdminGate>
      <AlertsPage />
    </AdminGate>
  ),
});

function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAcked, setShowAcked] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("admin_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!showAcked) q = q.is("acknowledged_at", null);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setAlerts((data ?? []) as Alert[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin_alerts_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_alerts" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAcked]);

  const ack = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("admin_alerts")
      .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: user?.id ?? null })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Alert acknowledged");
      load();
    }
  };

  const runCheckNow = async () => {
    const res = await fetch("/api/public/hooks/iframe-alert-check", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    toast.message("Check completed", { description: JSON.stringify(json) });
    load();
  };

  return (
    <main className="mx-auto max-w-3xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Admin alerts</h1>
          <p className="text-sm text-muted-foreground">
            System notifications when iframe failures or other issues exceed thresholds.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAcked((s) => !s)}>
            {showAcked ? "Hide acknowledged" : "Show acknowledged"}
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={runCheckNow}>Run check now</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-primary" />
            No {showAcked ? "" : "open "}alerts.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={`w-5 h-5 mt-0.5 ${a.severity === "critical" ? "text-destructive" : "text-yellow-600"}`}
                    />
                    <div>
                      <CardTitle className="text-base">{a.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()} · {a.kind}
                      </p>
                    </div>
                  </div>
                  <Badge variant={a.severity === "critical" ? "destructive" : "secondary"}>
                    {a.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{a.message}</p>
                {a.metadata && Object.keys(a.metadata).length > 0 && (
                  <pre className="text-[11px] bg-muted rounded-md p-2 overflow-x-auto">
                    {JSON.stringify(a.metadata, null, 2)}
                  </pre>
                )}
                <div className="flex items-center justify-between">
                  {a.acknowledged_at ? (
                    <span className="text-xs text-muted-foreground">
                      Acknowledged {new Date(a.acknowledged_at).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Open</span>
                  )}
                  {!a.acknowledged_at && (
                    <Button size="sm" variant="outline" onClick={() => ack(a.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Acknowledge
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
