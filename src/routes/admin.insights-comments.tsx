import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, RefreshCw, Trash2, ArrowLeft, MessageSquare } from "lucide-react";
import { toast } from "sonner";

type Comment = {
  id: string;
  article_slug: string;
  user_id: string;
  name: string;
  position: string | null;
  company: string | null;
  body: string;
  status: "approved" | "rejected" | "pending";
  moderation_reason: string | null;
  created_at: string;
};

type Filter = "rejected" | "approved" | "all";

export const Route = createFileRoute("/admin/insights-comments")({
  head: () => ({
    meta: [
      { title: "Comment moderation — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AdminGate>
      <ModerationPage />
    </AdminGate>
  ),
});

function fmt(d: string) {
  return new Date(d).toLocaleString();
}

function ModerationPage() {
  const [filter, setFilter] = useState<Filter>("rejected");
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("insights_comments")
      .select("id,article_slug,user_id,name,position,company,body,status,moderation_reason,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setItems((data ?? []) as Comment[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: string) => {
    const { error } = await supabase
      .from("insights_comments")
      .update({ status: "approved", moderation_reason: "admin-approved" })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Comment approved");
    setItems((prev) => prev.filter((c) => c.id !== id || filter === "all"));
    if (filter === "all") load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this comment? This cannot be undone.")) return;
    const { error } = await supabase.from("insights_comments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Comment deleted");
    setItems((prev) => prev.filter((c) => c.id !== id));
  };

  const counts = items.length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/alerts">
            <ArrowLeft className="mr-1 h-4 w-4" /> Admin
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MessageSquare className="h-5 w-5" /> Comment moderation
          </h1>
          <p className="text-sm text-muted-foreground">
            Review comments flagged by automatic moderation. Approve to publish, or remove.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-1 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        {(["rejected", "approved", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-muted-foreground">
          {loading ? "Loading…" : `${counts} ${counts === 1 ? "comment" : "comments"}`}
        </span>
      </div>

      {!loading && counts === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nothing to review.
          </CardContent>
        </Card>
      )}

      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.id}>
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    {(c.position || c.company) && (
                      <p className="text-[11px] text-muted-foreground">
                        {[c.position, c.company].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={c.status === "approved" ? "default" : "destructive"}
                      className="capitalize"
                    >
                      {c.status}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{fmt(c.created_at)}</span>
                  </div>
                </div>
                <p className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{c.body}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-muted-foreground">
                    On{" "}
                    <Link
                      to="/insights/$slug"
                      params={{ slug: c.article_slug }}
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      /insights/{c.article_slug}
                    </Link>
                    {c.moderation_reason && (
                      <span className="ml-2 italic">— {c.moderation_reason}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {c.status !== "approved" && (
                      <Button size="sm" onClick={() => approve(c.id)}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => remove(c.id)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
