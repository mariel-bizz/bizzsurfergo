import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { X, Bell, Crown, AlarmClock, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { listMyNotifications, markNotificationsRead } from "@/lib/notifications.functions";

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
};

function iconFor(kind: string) {
  if (kind.startsWith("quota_")) return Crown;
  if (kind === "waitlist_open") return Users;
  if (kind === "waitlist_joined") return AlarmClock;
  return Bell;
}

function ctaFor(kind: string): { to: string; label: string } | null {
  if (kind === "quota_exhausted" || kind === "quota_last_slot") return { to: "/pricing", label: "Upgrade" };
  if (kind === "quota_reset") return { to: "/events", label: "Browse events" };
  if (kind === "waitlist_open") return { to: "/events", label: "Confirm RSVP" };
  return null;
}

export function NotificationsBanner() {
  const list = useServerFn(listMyNotifications);
  const markRead = useServerFn(markNotificationsRead);
  const [items, setItems] = useState<Notif[]>([]);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authed) {
      setItems([]);
      return;
    }
    list()
      .then((r) => setItems((r.notifications ?? []) as unknown as Notif[]))
      .catch(() => {});
  }, [authed, list]);

  const dismiss = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await markRead({ data: { ids: [id] } });
    } catch {
      /* ignore */
    }
  };

  if (!authed || items.length === 0) return null;
  const top = items[0];
  const Icon = iconFor(top.kind);
  const cta = ctaFor(top.kind);

  return (
    <div className="mx-auto max-w-md px-3 pt-2">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 flex items-start gap-3 shadow-soft">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">{top.title}</p>
          {top.body && <p className="text-xs text-muted-foreground mt-0.5">{top.body}</p>}
          {cta && (
            <Link
              to={cta.to}
              onClick={() => dismiss(top.id)}
              className="inline-block mt-2 text-xs font-extrabold text-primary underline"
            >
              {cta.label} →
            </Link>
          )}
          {items.length > 1 && (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">
              +{items.length - 1} more notification{items.length - 1 === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <button
          aria-label="Dismiss"
          onClick={() => dismiss(top.id)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
