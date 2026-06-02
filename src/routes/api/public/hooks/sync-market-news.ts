import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/1hRxMtRQV4FR5ipU9jRFO_Z_YBfzV_PNLP_zHKwsTbx4/export?format=csv&gid=0";

export const Route = createFileRoute("/api/public/hooks/sync-market-news")({
  server: {
    handlers: {
      POST: async () => {
        const csvUrl = CSV_URL;

        // Fetch with up to 3 attempts + exponential backoff. Publisher feeds
        // (Google Sheets export, Cloudflare-fronted origins) occasionally return
        // 403/429/5xx on the first hit and succeed shortly after.
        const fetchWithRetry = async (): Promise<{ ok: true; text: string } | { ok: false; status?: number; error: string }> => {
          let lastErr = "";
          let lastStatus: number | undefined;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const res = await fetch(csvUrl, {
                headers: {
                  Accept: "text/csv",
                  // Some Cloudflare-fronted origins block requests without a UA.
                  "User-Agent": "BizzSurferBot/1.0 (+https://bizzsurfer.ai)",
                },
              });
              if (res.ok) return { ok: true, text: await res.text() };
              lastStatus = res.status;
              lastErr = `${res.status} ${res.statusText}`;
              // Don't retry on 4xx that isn't 408/425/429.
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
            { status: 502 }
          );
        }
        const csvText = fetched.text;

        const rows = parseCsv(csvText);
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
          let slug = (row.slug ?? "").trim() || slugify(title);

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

          // Deduplicate slug if it already exists for a different row in this batch
          // We'll let Postgres ON CONFLICT handle it per-row
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
            // We can't distinguish insert vs update from upsert, so we estimate:
            // Count as inserted if the row was new, updated if existing.
            // For simplicity, we approximate: if created_at is recent it's an insert.
            // Actually, let's just count all as "upserted" and split based on whether the slug existed before.
            // A simpler approach: query before upsert to know if it exists.
            const { data: existing } = await supabaseAdmin
              .from("market_news")
              .select("id")
              .eq("slug", slug)
              .maybeSingle();
            if (existing) {
              updated++;
            } else {
              inserted++;
            }
          }
        }

        return Response.json({ ok: true, inserted, updated, skipped, errors });
      },
    },
  },
});

function parseCsv(text: string): Record<string, string>[] {
  // Parse with multi-line quoted field support
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
