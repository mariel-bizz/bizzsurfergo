import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Heart, MessageCircle, Share2, Linkedin, Link as LinkIcon, Mail, MessageCircleMore, Loader2, Trash2 } from "lucide-react";
import {
  type EngagementProfile,
  loadProfile,
  marketingUrlForSlug,
  trackInsightAction,
} from "@/lib/insights-engagement";
import { EngagementProfileDialog } from "./EngagementProfileDialog";

type Like = { id: string; user_id: string };
type Comment = {
  id: string;
  user_id: string;
  name: string;
  position: string | null;
  company: string | null;
  body: string;
  created_at: string;
};

function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return session;
}

function profileFromSession(session: Session | null): EngagementProfile | null {
  const m = session?.user?.user_metadata as Record<string, unknown> | undefined;
  if (!m) return null;
  const name =
    (m.full_name as string) ||
    (m.name as string) ||
    [m.given_name, m.family_name].filter(Boolean).join(" ").trim();
  if (!name) return null;
  return {
    name,
    position: (m.position as string) || (m.title as string) || "",
    company: (m.company as string) || (m.organization as string) || "",
  };
}

function formatWhen(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function ArticleEngagement({ slug, articleTitle }: { slug: string; articleTitle: string }) {
  const session = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const url = marketingUrlForSlug(slug);

  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"like" | "comment" | null>(null);
  const [draft, setDraft] = useState("");

  const profile = useMemo(() => loadProfile() ?? profileFromSession(session), [session]);

  const likeCountQ = useQuery({
    queryKey: ["insights-like-count", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_insights_like_count", { _slug: slug });
      if (error) throw error;
      return Number(data ?? 0);
    },
  });

  const myLikeQ = useQuery({
    queryKey: ["insights-my-like", slug, session?.user?.id ?? null],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from("insights_likes")
        .select("id")
        .eq("article_slug", slug)
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as Like | null) ?? null;
    },
  });

  const commentsQ = useQuery({
    queryKey: ["insights-comments", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insights_comments")
        .select("id,user_id,name,position,company,body,created_at")
        .eq("article_slug", slug)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Comment[];
    },
  });

  const myLike = myLikeQ.data ?? null;
  const likeCount = likeCountQ.data ?? 0;

  const requireAuth = (next: "like" | "comment") => {
    if (!session) {
      toast.info("Sign in to continue");
      navigate({ to: "/login", search: { redirect: window.location.pathname } });
      return false;
    }
    if (!profile) {
      setPendingAction(next);
      setProfileOpen(true);
      return false;
    }
    return true;
  };

  const likeMut = useMutation({
    mutationFn: async (p: EngagementProfile) => {
      if (!session) throw new Error("Not signed in");
      if (myLike) {
        const { error } = await supabase.from("insights_likes").delete().eq("id", myLike.id);
        if (error) throw error;
        await trackInsightAction(slug, "unlike");
        return "removed";
      }
      const { error } = await supabase.from("insights_likes").insert({
        article_slug: slug,
        user_id: session.user.id,
        name: p.name,
        position: p.position || null,
        company: p.company || null,
      });
      if (error) throw error;
      await trackInsightAction(slug, "like");
      return "added";
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insights-like-count", slug] });
      qc.invalidateQueries({ queryKey: ["insights-my-like", slug] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const commentMut = useMutation({
    mutationFn: async ({ p, body }: { p: EngagementProfile; body: string }) => {
      if (!session) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("insights_comments")
        .insert({
          article_slug: slug,
          user_id: session.user.id,
          name: p.name,
          position: p.position || null,
          company: p.company || null,
          body: body.trim(),
        })
        .select("id,status,moderation_reason")
        .single();
      if (error) throw error;
      await trackInsightAction(slug, "comment");
      return data as { id: string; status: string; moderation_reason: string | null };
    },
    onSuccess: (data) => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["insights-comments", slug] });
      if (data.status === "rejected") {
        toast.error("Your comment was hidden by automatic moderation. Keep it constructive please.");
      } else {
        toast.success("Comment posted");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCommentMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("insights_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insights-comments", slug] }),
  });

  const onLike = () => {
    if (!requireAuth("like")) return;
    if (profile) likeMut.mutate(profile);
  };

  const onComment = () => {
    if (!draft.trim()) return;
    if (!requireAuth("comment")) return;
    if (profile) commentMut.mutate({ p: profile, body: draft });
  };

  const onProfileSubmit = (p: EngagementProfile) => {
    setProfileOpen(false);
    if (pendingAction === "like") likeMut.mutate(p);
    if (pendingAction === "comment" && draft.trim()) commentMut.mutate({ p, body: draft });
    setPendingAction(null);
  };

  const shareText = `${articleTitle} — via BizzSurfer`;

  const shareLinkedIn = () => {
    trackInsightAction(slug, "share-linkedin");
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const shareEmail = () => {
    trackInsightAction(slug, "share-email");
    window.location.href = `mailto:?subject=${encodeURIComponent(articleTitle)}&body=${encodeURIComponent(`${shareText}\n${url}`)}`;
  };
  const shareWhatsApp = () => {
    trackInsightAction(slug, "share-whatsapp");
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
      trackInsightAction(slug, "share-copy");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <section className="mt-6 border-t border-border pt-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={myLike ? "default" : "outline"}
          size="sm"
          onClick={onLike}
          disabled={likeMut.isPending}
          aria-pressed={!!myLike}
          className="gap-1.5"
        >
          <Heart className={`h-4 w-4 ${myLike ? "fill-current" : ""}`} />
          {likeCount} {likeCount === 1 ? "Like" : "Likes"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const el = document.getElementById("comments");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="gap-1.5"
        >
          <MessageCircle className="h-4 w-4" />
          {commentsQ.data?.length ?? 0} Comments
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={shareLinkedIn}>
              <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareWhatsApp}>
              <MessageCircleMore className="mr-2 h-4 w-4" /> WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareEmail}>
              <Mail className="mr-2 h-4 w-4" /> Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyLink}>
              <LinkIcon className="mr-2 h-4 w-4" /> Copy link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div id="comments" className="mt-6 scroll-mt-20">
        <h2 className="text-lg font-bold">Comments</h2>
        <div className="mt-3 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={session ? "Share your thoughts…" : "Sign in to comment"}
            rows={3}
            maxLength={2000}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Comments are auto-moderated for negative or abusive language.</span>
            <Button size="sm" onClick={onComment} disabled={!draft.trim() || commentMut.isPending}>
              {commentMut.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Post
            </Button>
          </div>
        </div>

        <ul className="mt-5 space-y-4">
          {commentsQ.isLoading && <li className="text-sm text-muted-foreground">Loading…</li>}
          {!commentsQ.isLoading && (commentsQ.data?.length ?? 0) === 0 && (
            <li className="text-sm text-muted-foreground">Be the first to comment.</li>
          )}
          {commentsQ.data?.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  {(c.position || c.company) && (
                    <p className="text-[11px] text-muted-foreground">
                      {[c.position, c.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{formatWhen(c.created_at)}</span>
                  {session?.user?.id === c.user_id && (
                    <button
                      aria-label="Delete comment"
                      onClick={() => deleteCommentMut.mutate(c.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{c.body}</p>
            </li>
          ))}
        </ul>
      </div>

      <EngagementProfileDialog
        open={profileOpen}
        initial={profile}
        onOpenChange={(v) => {
          setProfileOpen(v);
          if (!v) setPendingAction(null);
        }}
        onSubmit={onProfileSubmit}
      />
    </section>
  );
}
