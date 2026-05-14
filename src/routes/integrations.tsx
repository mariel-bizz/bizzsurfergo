import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plug, Database, Users, BarChart3, Briefcase, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — BizzSurfer" },
      {
        name: "description",
        content:
          "Connect your ERP, CRM, HRIS, BI and SaaS tools so agents can orchestrate across them.",
      },
    ],
  }),
  component: IntegrationsPage,
});

const categories = [
  { icon: Briefcase, name: "ERP", desc: "SAP, Oracle, NetSuite, Microsoft Dynamics" },
  { icon: Users, name: "CRM", desc: "Salesforce, HubSpot, Pipedrive" },
  { icon: Users, name: "HRIS", desc: "Workday, BambooHR, Personio" },
  { icon: BarChart3, name: "BI & Analytics", desc: "Looker, Power BI, Tableau, Amplitude" },
  { icon: Database, name: "Data & SaaS", desc: "Snowflake, Databricks, Notion, Slack" },
];

function IntegrationsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { isActive, loading } = useSubscription(user?.id ?? null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id });
      setAuthChecked(true);
    });
  }, []);

  // Gate: Premium only
  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: "/integrations" } });
      return;
    }
    if (!loading && !isActive) {
      navigate({ to: "/pricing" });
    }
  }, [authChecked, user, loading, isActive, navigate]);

  if (!authChecked || loading || !isActive) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-5">
        <p className="text-sm text-muted-foreground">Checking your plan…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-6 max-w-3xl mx-auto space-y-5">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((c) => (
          <Card key={c.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <c.icon className="w-4 h-4 text-primary" /> {c.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{c.desc}</p>
              <Button size="sm" variant="outline" className="mt-3 w-full" disabled>
                Configure (coming soon)
              </Button>
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
    </div>
  );
}
