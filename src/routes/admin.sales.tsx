import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminGate } from "@/components/AdminGate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSalesAnalytics } from "@/lib/sales-analytics.functions";
import { RefreshCw, TrendingUp, Users, ShoppingBag, DollarSign } from "lucide-react";

type Range = { key: "7d" | "30d" | "90d"; label: string; days: number };
const RANGES: Range[] = [
  { key: "7d", label: "Last 7d", days: 7 },
  { key: "30d", label: "Last 30d", days: 30 },
  { key: "90d", label: "Last 90d", days: 90 },
];

export const Route = createFileRoute("/admin/sales")({
  head: () => ({
    meta: [
      { title: "Sales & Conversion Analytics" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AdminGate>
      <SalesAnalyticsPage />
    </AdminGate>
  ),
});

function fmtMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function SalesAnalyticsPage() {
  const [range, setRange] = useState<Range>(RANGES[1]);
  const fetchAnalytics = useServerFn(getSalesAnalytics);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["sales-analytics", range.days],
    queryFn: () => fetchAnalytics({ data: { days: range.days } }),
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sales & Conversion</h1>
            <p className="text-sm text-muted-foreground">
              Waitlist → purchase funnel and lead sources.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {RANGES.map((r) => (
              <Button
                key={r.key}
                size="sm"
                variant={r.key === range.key ? "default" : "outline"}
                onClick={() => setRange(r)}
              >
                {r.label}
              </Button>
            ))}
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {isLoading || !data ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <StatCard
                icon={<Users className="w-4 h-4" />}
                label="Waitlist signups"
                value={data.stats.waitlistSignups.toLocaleString()}
              />
              <StatCard
                icon={<ShoppingBag className="w-4 h-4" />}
                label="Orders"
                value={data.stats.orders.toLocaleString()}
                sub={`${data.stats.subscriptions} subscriptions`}
              />
              <StatCard
                icon={<DollarSign className="w-4 h-4" />}
                label="Revenue"
                value={fmtMoney(data.stats.revenueCents)}
                sub={`Live: ${fmtMoney(data.stats.liveRevenueCents)}`}
              />
              <StatCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Waitlist → Purchase"
                value={`${(data.stats.conversionRate * 100).toFixed(1)}%`}
                sub={`${data.stats.convertedCount} converted`}
              />
            </div>

            {/* Daily series */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Signups & orders over time</CardTitle>
                <CardDescription>Daily totals across the selected window</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer>
                    <AreaChart data={data.series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="signups" stroke="#ea580c" fill="#fed7aa" name="Signups" />
                      <Area type="monotone" dataKey="orders" stroke="#2563eb" fill="#bfdbfe" name="Orders" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {/* Lead sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top lead sources</CardTitle>
                  <CardDescription>From outbound click attribution</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.leadSources.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No click data yet.</p>
                  ) : (
                    <div style={{ width: "100%", height: 240 }}>
                      <ResponsiveContainer>
                        <BarChart data={data.leadSources} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis dataKey="source" type="category" tick={{ fontSize: 11 }} width={120} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#ea580c" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Role breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Waitlist by role</CardTitle>
                  <CardDescription>Top roles signing up</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.roleBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No signups yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {data.roleBreakdown.map((r) => (
                        <li key={r.role} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-foreground">{r.role}</span>
                          <Badge variant="secondary">{r.count}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent signups */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Recent waitlist signups</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {data.recentSignups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No signups in this window.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b">
                        <th className="py-2 pr-3">When</th>
                        <th className="py-2 pr-3">Name</th>
                        <th className="py-2 pr-3">Email</th>
                        <th className="py-2 pr-3">Role</th>
                        <th className="py-2">Company</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentSignups.map((s) => (
                        <tr key={s.id} className="border-b border-border/50">
                          <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                            {new Date(s.created_at).toLocaleString()}
                          </td>
                          <td className="py-2 pr-3">{s.name}</td>
                          <td className="py-2 pr-3">{s.email}</td>
                          <td className="py-2 pr-3">{s.role || "—"}</td>
                          <td className="py-2">{s.company || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Recent orders */}
            <Card className="mt-4 mb-10">
              <CardHeader>
                <CardTitle className="text-base">Recent orders</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {data.recentOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders in this window.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b">
                        <th className="py-2 pr-3">When</th>
                        <th className="py-2 pr-3">Email</th>
                        <th className="py-2 pr-3">Listing</th>
                        <th className="py-2 pr-3">Amount</th>
                        <th className="py-2">Env</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.map((o) => (
                        <tr key={o.id} className="border-b border-border/50">
                          <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                            {new Date(o.created_at).toLocaleString()}
                          </td>
                          <td className="py-2 pr-3">{o.email || "—"}</td>
                          <td className="py-2 pr-3">{o.listing || "—"}</td>
                          <td className="py-2 pr-3">
                            {o.amount.toLocaleString()} {(o.currency || "").toUpperCase()}
                          </td>
                          <td className="py-2">
                            <Badge variant={o.environment === "live" ? "default" : "secondary"}>
                              {o.environment}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}
