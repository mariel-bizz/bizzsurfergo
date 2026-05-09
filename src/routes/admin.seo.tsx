import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { validateStructuredData, type ValidationResult } from "@/lib/seo-validate.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { AdminGate } from "@/components/AdminGate";
import { OutboundClicksPanel } from "@/components/admin/OutboundClicksPanel";
import { Separator } from "@/components/ui/separator";

const SITE = "https://bizzsurfergo.lovable.app";
const PRESET_PATHS = ["/", "/chat", "/events", "/pricing", "/profile"];

export const Route = createFileRoute("/admin/seo")({
  head: () => ({
    meta: [
      { title: "SEO Structured Data Validator" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AdminGate>
      <AdminSeoPage />
    </AdminGate>
  ),
});

function severityIcon(s: string) {
  if (s === "error") return <AlertCircle className="h-4 w-4 text-destructive" />;
  if (s === "warning") return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  return <Info className="h-4 w-4 text-muted-foreground" />;
}

function AdminSeoPage() {
  const fn = useServerFn(validateStructuredData);
  const [url, setUrl] = useState(`${SITE}/`);
  const mutation = useMutation<ValidationResult, Error, string>({
    mutationFn: (target) => fn({ data: { url: target } }),
  });

  const result = mutation.data;
  const errors = result?.issues.filter((i) => i.severity === "error") ?? [];
  const warnings = result?.issues.filter((i) => i.severity === "warning") ?? [];
  const infos = result?.issues.filter((i) => i.severity === "info") ?? [];

  return (
    <main className="container mx-auto max-w-4xl space-y-6 p-4 pb-24">
      <header>
        <h1 className="text-2xl font-bold">SEO Structured Data Validator</h1>
        <p className="text-sm text-muted-foreground">
          Fetches a page's HTML, extracts JSON-LD, and validates BreadcrumbList & FAQPage against Google's Rich Results requirements.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Check a URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PRESET_PATHS.map((p) => (
              <Button
                key={p}
                size="sm"
                variant="secondary"
                onClick={() => setUrl(`${SITE}${p}`)}
              >
                {p}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page"
            />
            <Button
              onClick={() => mutation.mutate(url)}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Checking…" : "Validate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {mutation.isError && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">
            {mutation.error.message}
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant={result.status === 200 ? "secondary" : "destructive"}>
                  HTTP {result.status}
                </Badge>
                <Badge variant="secondary">{result.jsonLdBlocks} JSON-LD block(s)</Badge>
                <Badge variant="secondary">Breadcrumbs: {result.detected.breadcrumbs}</Badge>
                <Badge variant="secondary">FAQs: {result.detected.faqs}</Badge>
                {errors.length === 0 && warnings.length === 0 && (
                  <Badge className="bg-green-600 text-white hover:bg-green-700">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Passing
                  </Badge>
                )}
                {errors.length > 0 && (
                  <Badge variant="destructive">{errors.length} error(s)</Badge>
                )}
                {warnings.length > 0 && (
                  <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
                    {warnings.length} warning(s)
                  </Badge>
                )}
              </div>
              {result.detected.other.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Other schemas: {[...new Set(result.detected.other)].join(", ")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Issues</CardTitle>
            </CardHeader>
            <CardContent>
              {result.issues.length === 0 ? (
                <p className="text-sm text-muted-foreground">No issues found.</p>
              ) : (
                <ul className="space-y-2">
                  {[...errors, ...warnings, ...infos].map((it, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5">{severityIcon(it.severity)}</span>
                      <div>
                        <span className="font-medium">{it.schema}:</span> {it.message}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detected schemas</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-96 overflow-auto rounded bg-muted p-3 text-xs">
                {result.rawSchemas}
              </pre>
            </CardContent>
          </Card>
        </>
      )}

      <Separator className="my-4" />
      <OutboundClicksPanel />
    </main>
  );
}

