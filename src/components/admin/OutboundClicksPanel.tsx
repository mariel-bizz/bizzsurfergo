import { useEffect, useMemo, useState } from "react";
import { format, subDays, startOfDay } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Click = {
  id: string;
  source: string;
  destination: string;
  referrer: string | null;
  user_agent: string | null;
  path: string | null;
  user_id: string | null;
  created_at: string;
};

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
];

export function OutboundClicksPanel() {
  const [days, setDays] = useState("30");
  const [source, setSource] = useState<string>("all");
  const [path, setPath] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Click[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const since = startOfDay(subDays(new Date(), Number(days))).toISOString();
    const { data, error } = await supabase
      .from("outbound_clicks")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) setError(error.message);
    setRows((data ?? []) as Click[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const sources = useMemo(
    () => Array.from(new Set(rows.map((r) => r.source))).sort(),
    [rows],
  );
  const paths = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.path ?? "(unknown)"))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (source !== "all" && r.source !== source) return false;
      if (path !== "all" && (r.path ?? "(unknown)") !== path) return false;
      if (!q) return true;
      return (
        r.source.toLowerCase().includes(q) ||
        (r.referrer ?? "").toLowerCase().includes(q) ||
        (r.path ?? "").toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q)
      );
    });
  }, [rows, source, path, search]);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = Number(days) - 1; i >= 0; i--) {
      map.set(format(subDays(new Date(), i), "MMM d"), 0);
    }
    for (const r of filtered) {
      const k = format(new Date(r.created_at), "MMM d");
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map, ([date, count]) => ({ date, count }));
  }, [filtered, days]);

  const bySource = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      map.set(r.source, (map.get(r.source) ?? 0) + 1);
    }
    return Array.from(map, ([source, count]) => ({ source, count })).sort(
      (a, b) => b.count - a.count,
    );
  }, [filtered]);

  const byReferrer = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const key = r.referrer ? new URL(safeUrl(r.referrer)).hostname || "direct" : "direct";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map, ([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filtered]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Outbound clicks</h2>
          <p className="text-sm text-muted-foreground">
            Conversions to external destinations (e.g., bizzsurfer.com).
          </p>
        </div>
        <Badge variant="secondary">{filtered.length} events</Badge>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-4">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={path} onValueChange={setPath}>
            <SelectTrigger><SelectValue placeholder="Path" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All paths</SelectItem>
              {paths.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              {loading ? "…" : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Clicks over time</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">By source</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySource}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="source" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Top referrers</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byReferrer} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis type="category" dataKey="referrer" width={140} fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Events</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead>Destination</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 200).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {format(new Date(r.created_at), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell className="text-xs">{r.source}</TableCell>
                  <TableCell className="text-xs">{r.path ?? "—"}</TableCell>
                  <TableCell className="max-w-[260px] truncate text-xs">{r.referrer || "direct"}</TableCell>
                  <TableCell className="max-w-[240px] truncate text-xs">{r.destination}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && !loading && (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No events in range.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {filtered.length > 200 && (
            <p className="p-3 text-center text-xs text-muted-foreground">Showing first 200 of {filtered.length}.</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function safeUrl(u: string): string {
  try {
    return new URL(u).toString();
  } catch {
    return "https://invalid.local/";
  }
}
