import { supabase } from "@/integrations/supabase/client";

export const MARKETING_BASE = "https://www.bizzsurfer.com";

export function marketingUrlForSlug(slug: string) {
  return `${MARKETING_BASE}/insights/${slug}`;
}

/**
 * Logs a view to outbound_clicks so we can attribute traffic to the
 * canonical marketing URL even when the article is read inside the app.
 * Public INSERT policy on outbound_clicks allows anonymous logging.
 */
export async function trackInsightView(slug: string) {
  try {
    await supabase.from("outbound_clicks").insert({
      source: `insights-view:${slug}`,
      destination: marketingUrlForSlug(slug),
      path: typeof window !== "undefined" ? window.location.pathname : `/insights/${slug}`,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch {
    // best-effort; never block UI
  }
}

export async function trackInsightAction(
  slug: string,
  action: "like" | "unlike" | "comment" | "share-linkedin" | "share-email" | "share-whatsapp" | "share-copy",
) {
  try {
    await supabase.from("outbound_clicks").insert({
      source: `insights-${action}:${slug}`,
      destination: marketingUrlForSlug(slug),
      path: typeof window !== "undefined" ? window.location.pathname : `/insights/${slug}`,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch {
    /* noop */
  }
}

const PROFILE_KEY = "bizzsurfer:insights-profile";
export type EngagementProfile = { name: string; position: string; company: string };

export function loadProfile(): EngagementProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as EngagementProfile;
    if (!p?.name?.trim()) return null;
    return p;
  } catch {
    return null;
  }
}

export function saveProfile(p: EngagementProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}
