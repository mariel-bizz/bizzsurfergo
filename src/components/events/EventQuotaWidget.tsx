import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { CalendarCheck, Crown, Infinity as InfinityIcon } from "lucide-react";
import { getEventQuotaStatus } from "@/lib/rsvp.functions";
import { supabase } from "@/integrations/supabase/client";

export interface EventQuotaState {
  loading: boolean;
  authed: boolean;
  tier: "free" | "hero" | "champion" | "team" | null;
  limit: number | null;
  used: number;
  remaining: number | null;
  period: "month" | "year" | null;
  resetsAt: string | null;
  refetch: () => void;
}

export function useEventQuota(): EventQuotaState {
  const fetchStatus = useServerFn(getEventQuotaStatus);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    tier: EventQuotaState["tier"];
    limit: number | null;
    used: number;
    remaining: number | null;
    period: EventQuotaState["period"];
    resetsAt: string | null;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchStatus();
      setData({
        tier: r.tier as EventQuotaState["tier"],
        limit: r.limit,
        used: r.used,
        remaining: r.remaining,
        period: r.period as EventQuotaState["period"],
        resetsAt: r.resetsAt,
      });
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const a = !!data.session;
      setAuthed(a);
      if (a) load();
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const a = !!session;
      setAuthed(a);
      if (a) load();
      else setData(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  return {
    loading,
    authed,
    tier: data?.tier ?? null,
    limit: data?.limit ?? null,
    used: data?.used ?? 0,
    remaining: data?.remaining ?? null,
    period: data?.period ?? null,
    resetsAt: data?.resetsAt ?? null,
    refetch: load,
  };
}

function formatResetDate(iso: string | null, period: EventQuotaState["period"]): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (period === "year") return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

export function EventQuotaWidget() {
  const q = useEventQuota();

  if (!q.authed) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Your event allowance</h3>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Sign in to see how many event RSVPs are included in your plan.
        </p>
        <Link
          to="/login"
          className="mt-3 inline-flex text-xs font-bold text-primary hover:underline"
        >
          Sign in →
        </Link>
      </div>
    );
  }

  if (q.loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card animate-pulse">
        <div className="h-4 w-1/2 bg-muted rounded mb-2" />
        <div className="h-3 w-2/3 bg-muted rounded" />
      </div>
    );
  }

  const unlimited = q.limit === null;
  const tierLabel = (q.tier ?? "free").replace(/^\w/, (c) => c.toUpperCase());
  const remaining = q.remaining ?? 0;
  const exhausted = !unlimited && remaining <= 0;
  const pct = unlimited ? 100 : Math.min(100, Math.round((q.used / Math.max(1, q.limit ?? 1)) * 100));

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarCheck className="w-4 h-4 text-primary shrink-0" />
          <h3 className="text-sm font-bold text-foreground truncate">Event RSVPs · {tierLabel}</h3>
        </div>
        {unlimited && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            <InfinityIcon className="w-3 h-3" /> Unlimited
          </span>
        )}
      </div>

      {unlimited ? (
        <p className="mt-2 text-xs text-muted-foreground">
          You can RSVP to every event — no monthly cap.
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{remaining}</span>
            <span className="text-xs text-muted-foreground">
              of {q.limit} left this {q.period}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${exhausted ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Resets {formatResetDate(q.resetsAt, q.period)}
          </p>
          {exhausted && (
            <Link
              to="/pricing"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <Crown className="w-3.5 h-3.5" /> Upgrade for more events →
            </Link>
          )}
        </>
      )}
    </div>
  );
}
