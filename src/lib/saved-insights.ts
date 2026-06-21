import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "bizzsurfer:saved-insights";

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function writeLocal(slugs: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(Array.from(new Set(slugs))));
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

/** Union of localStorage + DB rows for the current user. */
export async function listSavedSlugs(): Promise<string[]> {
  const local = readLocal();
  const uid = await currentUserId();
  if (!uid) return local;
  const { data } = await supabase
    .from("saved_insights")
    .select("slug")
    .order("created_at", { ascending: false });
  const remote = (data ?? []).map((r) => r.slug as string);
  return Array.from(new Set([...remote, ...local]));
}

export async function isSaved(slug: string): Promise<boolean> {
  const all = await listSavedSlugs();
  return all.includes(slug);
}

export async function saveSlug(slug: string) {
  const local = readLocal();
  if (!local.includes(slug)) writeLocal([slug, ...local]);
  const uid = await currentUserId();
  if (uid) {
    await supabase
      .from("saved_insights")
      .upsert({ user_id: uid, slug }, { onConflict: "user_id,slug" });
  }
}

export async function unsaveSlug(slug: string) {
  writeLocal(readLocal().filter((s) => s !== slug));
  const uid = await currentUserId();
  if (uid) {
    await supabase.from("saved_insights").delete().eq("slug", slug);
  }
}

/** Push any unsynced local saves into the DB. Call once after sign-in. */
export async function syncLocalToCloud() {
  const uid = await currentUserId();
  if (!uid) return;
  const local = readLocal();
  if (!local.length) return;
  await supabase
    .from("saved_insights")
    .upsert(
      local.map((slug) => ({ user_id: uid, slug })),
      { onConflict: "user_id,slug" },
    );
}
