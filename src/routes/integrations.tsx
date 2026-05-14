import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Plug, Database, Users, BarChart3, Briefcase, ArrowLeft, Sparkles,
  CheckCircle2, AlertTriangle, RefreshCw, Trash2, Plus, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getPremiumStatus } from "@/lib/premium.functions";
import {
  listMyIntegrations,
  upsertIntegration,
  syncIntegration,
  disconnectIntegration,
  type IntegrationRow,
} from "@/lib/integrations.functions";

export const Route = createFileRoute("/integrations")({
  // Client-only premium gate. We skip on server prerender (no bearer token);
  // on the browser the check runs before the component mounts, so non-Premium
  // users never see the page.
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    try {
      const { isPremium } = await getPremiumStatus();
      if (!isPremium) {
        throw redirect({ to: "/pricing" });
      }
    } catch (e) {
      // Unauthorized → send to login; redirect throws are re-thrown
      if (e && typeof e === "object" && "to" in (e as object)) throw e;
      throw redirect({ to: "/login", search: { redirect: "/integrations" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Integrations — BizzSurfer" },
      {
        name: "description",
        content: "Connect your ERP, CRM, HRIS, BI and SaaS tools so agents can orchestrate across them.",
      },
    ],
  }),
  component: IntegrationsPage,
});

type Provider = { id: string; name: string; fields: ("base_url" | "api_key" | "account_id" | "workspace")[] };
type Category = { key: string; icon: typeof Plug; name: string; desc: string; providers: Provider[] };

const CATEGORIES: Category[] = [
  {
    key: "erp", icon: Briefcase, name: "ERP",
    desc: "SAP, Oracle, NetSuite, Microsoft Dynamics",
    providers: [
      { id: "sap", name: "SAP S/4HANA", fields: ["base_url", "api_key"] },
      { id: "oracle_netsuite", name: "Oracle NetSuite", fields: ["account_id", "api_key"] },
      { id: "ms_dynamics", name: "Microsoft Dynamics 365", fields: ["base_url", "api_key"] },
    ],
  },
  {
    key: "crm", icon: Users, name: "CRM",
    desc: "Salesforce, HubSpot, Pipedrive",
    providers: [
      { id: "salesforce", name: "Salesforce", fields: ["base_url", "api_key"] },
      { id: "hubspot", name: "HubSpot", fields: ["api_key"] },
      { id: "pipedrive", name: "Pipedrive", fields: ["api_key"] },
    ],
  },
  {
    key: "hris", icon: Users, name: "HRIS",
    desc: "Workday, BambooHR, Personio",
    providers: [
      { id: "workday", name: "Workday", fields: ["base_url", "api_key"] },
      { id: "bamboohr", name: "BambooHR", fields: ["account_id", "api_key"] },
      { id: "personio", name: "Personio", fields: ["api_key"] },
    ],
  },
  {
    key: "bi", icon: BarChart3, name: "BI & Analytics",
    desc: "Looker, Power BI, Tableau, Amplitude",
    providers: [
      { id: "looker", name: "Looker", fields: ["base_url", "api_key"] },
      { id: "power_bi", name: "Power BI", fields: ["workspace", "api_key"] },
      { id: "tableau", name: "Tableau", fields: ["base_url", "api_key"] },
      { id: "amplitude", name: "Amplitude", fields: ["api_key"] },
    ],
  },
  {
    key: "data", icon: Database, name: "Data & SaaS",
    desc: "Snowflake, Databricks, Notion, Slack",
    providers: [
      { id: "snowflake", name: "Snowflake", fields: ["account_id", "api_key"] },
      { id: "databricks", name: "Databricks", fields: ["base_url", "api_key"] },
      { id: "notion", name: "Notion", fields: ["api_key"] },
      { id: "slack", name: "Slack", fields: ["api_key"] },
    ],
  },
];

const FIELD_LABELS: Record<string, { label: string; placeholder: string; type?: string }> = {
  base_url: { label: "Base URL", placeholder: "https://your-instance.example.com" },
  api_key: { label: "API key", placeholder: "Paste your secret API key", type: "password" },
  account_id: { label: "Account ID", placeholder: "e.g. acct_12345" },
  workspace: { label: "Workspace", placeholder: "Workspace name or ID" },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function HealthBadge({ health }: { health: IntegrationRow["health"] }) {
  if (health === "healthy") {
    return (
      <Badge variant="secondary" className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0">
        <CheckCircle2 className="w-3 h-3" /> Healthy
      </Badge>
    );
  }
  if (health === "degraded") {
    return (
      <Badge variant="secondary" className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-0">
        <AlertTriangle className="w-3 h-3" /> Degraded
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 bg-destructive/15 text-destructive border-0">
      <AlertTriangle className="w-3 h-3" /> Down
    </Badge>
  );
}

function IntegrationsPage() {
  const navigate = useNavigate();
  const list = useServerFn(listMyIntegrations);
  const upsert = useServerFn(upsertIntegration);
  const sync = useServerFn(syncIntegration);
  const disconnect = useServerFn(disconnectIntegration);

  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<{ category: Category; provider: Provider } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    const { integrations } = await list();
    setRows(integrations as IntegrationRow[]);
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const connectedByProvider = useMemo(
    () => new Map(rows.map((r) => [r.provider, r])),
    [rows],
  );

  const onSync = async (row: IntegrationRow) => {
    setBusyId(row.id);
    try {
      const res = await sync({ data: { id: row.id } });
      toast.success(res.ok ? "Synced successfully" : "Synced with warnings");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusyId(null);
    }
  };

  const onDisconnect = async (row: IntegrationRow) => {
    if (!confirm(`Disconnect ${row.display_name ?? row.provider}?`)) return;
    setBusyId(row.id);
    try {
      await disconnect({ data: { id: row.id } });
      toast.success("Disconnected");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not disconnect");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen px-5 py-6 max-w-3xl mx-auto space-y-5 pb-24">
      <Link
        to="/profile"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to profile
      </Link>

      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
          <Sparkles className="w-3 h-3" /> Premium
        </span>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Plug className="w-6 h-6 text-primary" /> Integrations
        </h1>
        <p className="text-sm text-muted-foreground">
          Plug in your enterprise systems so Agentic AI can orchestrate decisions and execution across them.
        </p>
      </header>

      {/* Connected dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" /> Your connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No connections yet. Pick a provider below to get started.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {r.display_name ?? r.provider}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {r.category.toUpperCase()} · Last sync {timeAgo(r.last_sync_at)}
                      {r.last_error ? ` · ${r.last_error}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <HealthBadge health={r.health} />
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === r.id}
                      onClick={() => onSync(r)}
                      aria-label="Sync now"
                    >
                      <RefreshCw className={`w-4 h-4 ${busyId === r.id ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === r.id}
                      onClick={() => onDisconnect(r)}
                      aria-label="Disconnect"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Catalog */}
      <div className="space-y-4">
        {CATEGORIES.map((c) => (
          <Card key={c.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <c.icon className="w-4 h-4 text-primary" /> {c.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{c.desc}</p>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {c.providers.map((p) => {
                  const existing = connectedByProvider.get(p.id);
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-card"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        {existing ? (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Connected</p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">Not connected</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={existing ? "outline" : "default"}
                        onClick={() => setConfig({ category: c, provider: p })}
                      >
                        {existing ? "Reconfigure" : (
                          <>
                            <Plus className="w-3.5 h-3.5 mr-1" /> Connect
                          </>
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Need something else?</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Request a custom integration and our team will scope it with you.
        </CardContent>
      </Card>

      <ConfigureDialog
        open={!!config}
        onOpenChange={(v) => !v && setConfig(null)}
        target={config}
        onSaved={async () => {
          setConfig(null);
          await refresh();
          toast.success("Connection saved");
        }}
        save={async (payload) => {
          await upsert({ data: payload });
        }}
      />
    </div>
  );
}

function ConfigureDialog({
  open, onOpenChange, target, onSaved, save,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: { category: Category; provider: Provider } | null;
  onSaved: () => void | Promise<void>;
  save: (payload: {
    category: string;
    provider: string;
    display_name: string;
    config: Record<string, string>;
  }) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues({});
  }, [target?.provider.id]);

  if (!target) return null;
  const { category, provider } = target;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of provider.fields) {
      if (!values[f] || values[f].trim().length === 0) {
        toast.error(`${FIELD_LABELS[f].label} is required`);
        return;
      }
    }
    setSaving(true);
    try {
      await save({
        category: category.key,
        provider: provider.id,
        display_name: provider.name,
        config: values,
      });
      await onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect {provider.name}</DialogTitle>
          <DialogDescription>
            Credentials are stored on your account and used only to sync data on your behalf.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          {provider.fields.map((f) => {
            const meta = FIELD_LABELS[f];
            return (
              <div key={f} className="space-y-1">
                <Label htmlFor={f}>{meta.label}</Label>
                <Input
                  id={f}
                  type={meta.type ?? "text"}
                  placeholder={meta.placeholder}
                  value={values[f] ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, [f]: e.target.value }))}
                  autoComplete="off"
                />
              </div>
            );
          })}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save connection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
