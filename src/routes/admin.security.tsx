import { createFileRoute } from "@tanstack/react-router";
import { AdminGate } from "@/components/AdminGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ShieldCheck, ShieldAlert, ShieldQuestion, Wrench } from "lucide-react";
import { SECURITY_FINDINGS, summarize, type SecurityFinding } from "@/lib/security-findings";

export const Route = createFileRoute("/admin/security")({
  head: () => ({
    meta: [
      { title: "Security findings — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AdminGate>
      <AdminSecurityPage />
    </AdminGate>
  ),
});

const STATUS_META: Record<
  SecurityFinding["status"],
  { label: string; className: string; Icon: typeof ShieldCheck }
> = {
  fixed: {
    label: "Fixed",
    className: "bg-green-600 text-white hover:bg-green-700",
    Icon: ShieldCheck,
  },
  intentional: {
    label: "Intentional",
    className: "bg-blue-600 text-white hover:bg-blue-700",
    Icon: ShieldQuestion,
  },
  manual_action: {
    label: "Manual action",
    className: "bg-yellow-500 text-white hover:bg-yellow-600",
    Icon: Wrench,
  },
  open: {
    label: "Open",
    className: "bg-red-600 text-white hover:bg-red-700",
    Icon: ShieldAlert,
  },
};

const SEVERITY_META: Record<SecurityFinding["severity"], string> = {
  info: "bg-slate-200 text-slate-800",
  warn: "bg-amber-200 text-amber-900",
  critical: "bg-red-200 text-red-900",
};

function AdminSecurityPage() {
  const findings = SECURITY_FINDINGS;
  const s = summarize(findings);

  return (
    <main className="container mx-auto max-w-5xl space-y-6 p-4 pb-24">
      <header>
        <h1 className="text-2xl font-bold">Security findings</h1>
        <p className="text-sm text-muted-foreground">
          Consolidated view of every reviewed scanner finding (Supabase
          linter, Lovable security scanner, connector / Wiz scan, trust
          surface). New findings should be added to
          <code className="mx-1 rounded bg-muted px-1">src/lib/security-findings.ts</code>
          when reviewed.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total" value={s.total} />
        <SummaryCard label="Fixed" value={s.fixed} accent="text-green-600" />
        <SummaryCard label="Intentional" value={s.intentional} accent="text-blue-600" />
        <SummaryCard label="Manual" value={s.manual} accent="text-yellow-600" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Findings</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {findings.map((f) => {
              const meta = STATUS_META[f.status];
              const Icon = meta.Icon;
              return (
                <li key={f.id} className="space-y-2 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{f.name}</span>
                    <Badge className={meta.className}>{meta.label}</Badge>
                    <Badge className={SEVERITY_META[f.severity]}>{f.severity}</Badge>
                    <Badge variant="secondary">{f.source}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{f.note}</p>
                  {f.link && (
                    <a
                      href={f.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Remediation docs <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scheduled re-scan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <code className="rounded bg-muted px-1">/api/public/hooks/security-scan</code>{" "}
            runs a structural audit (RLS enabled on every public table, no missing
            write policies on tables granted to authenticated, no SECURITY DEFINER
            function with a mutable search_path) and dispatches an admin alert
            via Slack / webhook / email when something new appears.
          </p>
          <p>
            Schedule with pg_cron (header
            <code className="mx-1 rounded bg-muted px-1">x-cron-secret: $SECURITY_SCAN_CRON_SECRET</code>)
            or trigger it manually as an authenticated admin.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${accent ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
