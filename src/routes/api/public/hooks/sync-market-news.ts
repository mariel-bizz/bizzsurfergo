import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/1hRxMtRQV4FR5ipU9jRFO_Z_YBfzV_PNLP_zHKwsTbx4/export?format=csv&gid=0";

export const Route = createFileRoute("/api/public/hooks/sync-market-news")({
  server: {
    handlers: {
      POST: async ({ request }) => (await authorize(request)) ?? runSync(),
    },
  },
});

async function authorize(request: Request): Promise<Response | undefined> {
  // Option 1: shared cron secret (preferred for scheduled callers)
  const cronSecret = process.env.MARKET_NEWS_SYNC_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (cronSecret && provided && timingSafeEqualStr(provided, cronSecret)) {
    return undefined;
  }

  // Option 2: authenticated admin user (Bearer JWT + has_role admin)
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = auth.slice("Bearer ".length).trim();
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return new Response("Server misconfigured", { status: 500 });
  }
  const sb = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data: claimsData, error: claimsErr } = await sb.auth.getClaims(token);
  const userId = claimsData?.claims?.sub;
  if (claimsErr || !userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { data: isAdmin, error: roleErr } = await sb.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (roleErr || !isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }
  return undefined;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBuf = enc.encode(a);
  const bBuf = enc.encode(b);
  const len = Math.max(aBuf.byteLength, bBuf.byteLength, 32);
  let mismatch = aBuf.byteLength ^ bBuf.byteLength;
  for (let i = 0; i < len; i++) {
    const av = i < aBuf.byteLength ? aBuf[i] : 0;
    const bv = i < bBuf.byteLength ? bBuf[i] : 0;
    mismatch |= av ^ bv;
  }
  return mismatch === 0 && aBuf.byteLength === bBuf.byteLength;
}

async function runSync(): Promise<Response> {
  const csvUrl = CSV_URL;

  const fetchWithRetry = async (): Promise<
    { ok: true; text: string } | { ok: false; status?: number; error: string }
  > => {
    let lastErr = "";
    let lastStatus: number | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(csvUrl, {
          headers: {
            Accept: "text/csv",
            "User-Agent": "BizzSurferBot/1.0 (+https://bizzsurfer.ai)",
          },
        });
        if (res.ok) return { ok: true, text: await res.text() };
        lastStatus = res.status;
        lastErr = `${res.status} ${res.statusText}`;
        if (res.status >= 400 && res.status < 500 && ![408, 425, 429].includes(res.status)) break;
      } catch (e) {
        lastErr = e instanceof Error ? e.message : "Fetch failed";
      }
      if (attempt < 3) await new Promise((r) => setTimeout(r, 400 * attempt));
    }
    return { ok: false, status: lastStatus, error: lastErr };
  };

  const fetched = await fetchWithRetry();
  if (!fetched.ok) {
    const isBlocked = fetched.status === 403 || fetched.status === 429 || /cloudflare/i.test(fetched.error);
    const friendly = isBlocked
      ? "The publisher feed is temporarily blocked (Cloudflare). We'll retry on the next scheduled sync."
      : `Could not fetch the publisher feed after 3 attempts: ${fetched.error}`;
    return Response.json(
      { ok: false, error: friendly, status: fetched.status ?? null, blocked: isBlocked },
      { status: 502 },
    );
  }

  const rows = parseCsv(fetched.text);
  if (rows.length === 0) {
    return Response.json({ ok: true, inserted: 0, updated: 0, skipped: 0, errors: ["No rows found in CSV"] });
  }

  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const title = (row.title ?? "").trim();
    const source = (row.source ?? "").trim();
    const sourceUrl = (row.source_url ?? "").trim();
    const summary = (row.summary ?? "").trim() || null;
    const imageUrl = (row.image_url ?? "").trim() || null;
    const publishedAt = (row.published_at ?? "").trim() || null;
    const category = (row.category ?? "").trim() || "Operators";
    const slug = (row.slug ?? "").trim() || slugify(title);

    if (!title || !source || !sourceUrl) {
      skipped++;
      errors.push(`Skipped row: missing title, source, or source_url`);
      continue;
    }
    if (!isValidUrl(sourceUrl)) {
      skipped++;
      errors.push(`Skipped row: invalid source_url "${sourceUrl}"`);
      continue;
    }
    if (!slug) {
      skipped++;
      errors.push(`Skipped row: could not generate slug for "${title}"`);
      continue;
    }

    const payload = {
      slug,
      title,
      source,
      source_url: sourceUrl,
      summary,
      image_url: imageUrl,
      published_at: publishedAt,
      category,
    };

    const { error } = await supabaseAdmin
      .from("market_news")
      .upsert(payload, { onConflict: "slug" });

    if (error) {
      errors.push(`Row "${title}": ${error.message}`);
      skipped++;
    } else {
      const { data: existing } = await supabaseAdmin
        .from("market_news")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (existing) updated++;
      else inserted++;
    }
  }

  return Response.json({ ok: true, inserted, updated, skipped, errors });
}

function parseCsv(text: string): Record<string, string>[] {
  const records = parseCsvRecords(text);
  if (records.length < 2) return [];
  const headers = records[0].map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < records.length; i++) {
    const values = records[i];
    if (values.length === 1 && values[0] === "") continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else { field += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { current.push(field); field = ""; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        current.push(field); field = "";
        records.push(current);
        current = [];
      } else { field += ch; }
    }
  }
  if (field !== "" || current.length > 0) { current.push(field); records.push(current); }
  return records;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
