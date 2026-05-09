import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/AdminGate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type Range = "24h" | "7d" | "30d";

const RANGES: { key: Range; label: string; hours: number; bucketMin: number }[] = [
  { key: "24h", label: "Last 24h", hours: 24, bucketMin: 60 },
  { key: "7d", label: "Last 7d", hours: 24 * 7, bucketMin: 60 * 6 },
  { key: "30d", label: "Last 30d", hours: 24 * 30, bucketMin: 60 * 24 },
];

type Row = { created_at: string; path: string | null };
type Point = { ts: number; label: string; avg: number; p95: number; count: number };

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Admin Analytics" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AdminGate>
      <AnalyticsPage />
    </AdminGate>
  ),
});

function AnalyticsPage() {
  const [range, setRange] = useState<Range>("24h");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const cfg = RANGES.find((r) => r.key === range)!;

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - cfg.hours * 3600_000).toISOString();
    const { data, error } = await supabase
      .from("outbound_clicks")
      .select("created_at, path")
      .eq("source", "resources_iframe")
      .gte("created_at", since)
      .like("path", "loaded?ms=%")
      .order("created_at", { ascending: true })
      .limit(5000);
    if (!error) setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const points = useMemo<Point[]>(() => {
    const bucketMs = cfg.bucketMin * 60_000;
    const map = new Map<number, number[]>();
    for (const r of rows) {
      const ms = parseMs(r.path);
      if (ms == null) continue;
      const ts = Math.floor(new Date(r.created_at).getTime() / bucketMs) * bucketMs;
      const arr = map.get(ts) ?? [];
      arr.push(ms);
      map.set(ts, arr);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([ts, samples]) => {
        const sorted = [...samples].sort((a, b) => a - b);
        const avg = Math.round(sorted.reduce((s, v) => s + v, 0) / sorted.length);
        const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
        return {
          ts,
          label: formatBucket(ts, range),
          avg,
          p95,
          count: sorted.length,
        };
      });
  }, [rows, cfg.bucketMin, range]);

  const summary = useMemo(() => {
    const all = rows.map((r) => parseMs(r.path)).filter((v): v is number => v != null);
    if (all.length === 0) return null;
    const sorted = [...all].sort((a, b) => a - b);
    return {
      count: all.length,
      avg: Math.round(all.reduce((s, v) => s + v, 0) / all.length),
      p95: sorted[Math.floor(sorted.length * 0.95)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }, [rows]);

  return (
    <main className="mx-auto max-w-4xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Admin analytics</h1>
          <p className="text-sm text-muted-foreground">
            Insights iframe load performance (successful loads only).
          </p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.key}
              size="sm"
              variant={r.key === range ? "default" : "outline"}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Loads" value={summary ? summary.count.toString() : "—"} />
        <Stat label="Avg" value={summary ? `${summary.avg} ms` : "—"} />
        <Stat label="p95" value={summary ? `${summary.p95} ms` : "—"} />
        <Stat label="Max" value={summary ? `${summary.max} ms` : "—"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Iframe load duration</CardTitle>
          <CardDescription>
            Average and p95 milliseconds per {cfg.bucketMin >= 60 ? `${cfg.bucketMin / 60}h` : `${cfg.bucketMin}m`} bucket.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
          ) : points.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              No successful loads in this range yet.
            </p>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="avgFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickFormatter={(v) => `${v}ms`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number, name) => [`${value} ms`, name]}
                    labelFormatter={(l, payload) => {
                      const p = payload?.[0]?.payload as Point | undefined;
                      return `${l}${p ? ` · ${p.count} loads` : ""}`;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avg"
                    name="Average"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#avgFill)"
                  />
                  <Line
                    type="monotone"
                    dataKey="p95"
                    name="p95"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function parseMs(path: string | null): number | null {
  if (!path) return null;
  const m = /^loaded\?ms=(\d+)/.exec(path);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function formatBucket(ts: number, range: Range): string {
  const d = new Date(ts);
  if (range === "24h") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
