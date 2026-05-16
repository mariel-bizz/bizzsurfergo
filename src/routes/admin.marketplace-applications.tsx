import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Download,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type Application = {
  id: string;
  public_token: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  company: string | null;
  offering_type: string;
  title: string;
  description: string;
  website: string | null;
  status: "pending" | "approved" | "rejected";
  review_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  source: string | null;
  user_agent: string | null;
};

export const Route = createFileRoute("/admin/marketplace-applications")({
  head: () => ({
    meta: [
      { title: "Marketplace Applications" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AdminGate>
      <MarketplaceApplicationsPage />
    </AdminGate>
  ),
});

function MarketplaceApplicationsPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [range, setRange] = useState<string>("all");
  const [selected, setSelected] = useState<Application | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketplace_listing_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Application[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    const cutoff =
      range === "7d"
        ? now - 7 * 86400000
        : range === "30d"
          ? now - 30 * 86400000
          : range === "90d"
            ? now - 90 * 86400000
            : 0;
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (typeFilter !== "all" && r.offering_type !== typeFilter) return false;
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;
      if (q) {
        const hay =
          `${r.name} ${r.email} ${r.company ?? ""} ${r.title} ${r.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, query, statusFilter, typeFilter, range]);

  const counts = useMemo(() => {
    return {
      total: rows.length,
      pending: rows.filter((r) => r.status === "pending").length,
      approved: rows.filter((r) => r.status === "approved").length,
      rejected: rows.filter((r) => r.status === "rejected").length,
    };
  }, [rows]);

  const exportCsv = () => {
    if (!filtered.length) {
      toast.error("Nothing to export");
      return;
    }
    const header = [
      "created_at",
      "status",
      "name",
      "email",
      "company",
      "offering_type",
      "title",
      "website",
      "description",
      "review_notes",
      "reviewed_at",
    ];
    const escape = (v: unknown) =>
      `"${String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    const csv = [
      header.join(","),
      ...filtered.map((r) =>
        [
          r.created_at,
          r.status,
          r.name,
          r.email,
          r.company,
          r.offering_type,
          r.title,
          r.website,
          r.description,
          r.review_notes,
          r.reviewed_at,
        ]
          .map(escape)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marketplace-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} applications`);
  };

  const updateApplication = async (
    id: string,
    patch: { status?: Application["status"]; review_notes?: string | null },
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    const update: Record<string, any> = { ...patch };
    if (patch.status) {
      update.reviewed_at = new Date().toISOString();
      update.reviewed_by = user?.id ?? null;
    }
    const { error } = await supabase
      .from("marketplace_listing_applications")
      .update(update)
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Application updated");
    await load();
    if (selected?.id === id) {
      const fresh = (
        await supabase
          .from("marketplace_listing_applications")
          .select("*")
          .eq("id", id)
          .single()
      ).data as Application | null;
      setSelected(fresh);
    }
  };

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Marketplace Applications</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {rows.length} shown · {counts.pending} pending ·{" "}
            {counts.approved} approved · {counts.rejected} rejected
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button size="sm" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email, title…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="Agent">Agent</SelectItem>
              <SelectItem value="Service">Service</SelectItem>
              <SelectItem value="Playbook">Playbook</SelectItem>
              <SelectItem value="Template">Template</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger>
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Offering</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No applications match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                      {r.company && (
                        <div className="text-xs text-muted-foreground">
                          {r.company}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.title}</div>
                      <Badge variant="secondary" className="mt-1">
                        {r.offering_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusPill status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected(r)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ReviewDialog
        application={selected}
        onClose={() => setSelected(null)}
        onUpdate={updateApplication}
      />
    </main>
  );
}

function StatusPill({ status }: { status: Application["status"] }) {
  if (status === "approved") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border border-rose-200">
        <XCircle className="w-3 h-3 mr-1" /> Rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200">
      <Clock className="w-3 h-3 mr-1" /> Pending
    </Badge>
  );
}

function ReviewDialog({
  application,
  onClose,
  onUpdate,
}: {
  application: Application | null;
  onClose: () => void;
  onUpdate: (
    id: string,
    patch: { status?: Application["status"]; review_notes?: string | null },
  ) => Promise<void>;
}) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(application?.review_notes ?? "");
  }, [application?.id, application?.review_notes]);

  if (!application) return null;

  const handleAction = async (status: Application["status"]) => {
    setSaving(true);
    await onUpdate(application.id, {
      status,
      review_notes: notes.trim() ? notes.trim() : null,
    });
    setSaving(false);
  };

  return (
    <Dialog open={!!application} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{application.title}</DialogTitle>
          <DialogDescription>
            Submitted{" "}
            {new Date(application.created_at).toLocaleString()} ·{" "}
            <StatusPill status={application.status} />
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm mt-2">
          <Field label="Name" value={application.name} />
          <Field label="Email" value={application.email} mono />
          <Field label="Company" value={application.company || "—"} />
          <Field label="Offering" value={application.offering_type} />
          <Field
            label="Website"
            value={
              application.website ? (
                <a
                  href={application.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1"
                >
                  {application.website}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                "—"
              )
            }
          />
          <Field label="Source" value={application.source || "—"} />
        </div>

        <div className="mt-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Description
          </p>
          <p className="text-sm whitespace-pre-wrap border border-border rounded-lg p-3 bg-muted/30">
            {application.description}
          </p>
        </div>

        <div className="mt-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Reviewer notes (sent to applicant)
          </p>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes shown on the applicant's status page."
            maxLength={5000}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={`/marketplace/application/${application.public_token}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Applicant view
            </a>
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("pending")}
            disabled={saving}
          >
            Mark pending
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleAction("rejected")}
            disabled={saving}
          >
            <XCircle className="w-4 h-4 mr-1" /> Reject
          </Button>
          <Button
            size="sm"
            onClick={() => handleAction("approved")}
            disabled={saving}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
        {label}
      </p>
      <div className={mono ? "font-mono text-sm break-all" : "text-sm break-words"}>
        {value}
      </div>
    </div>
  );
}
