import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/hooks/sync-market-news")({
  server: {
    handlers: {
      POST: async () => {
        const csvUrl = process.env.MARKET_NEWS_CSV_URL;
        if (!csvUrl) {
          return Response.json(
            { ok: false, error: "MARKET_NEWS_CSV_URL not configured" },
            { status: 503 }
          );
        }

        let csvText: string;
        try {
          const res = await fetch(csvUrl, { headers: { Accept: "text/csv" } });
          if (!res.ok) {
            return Response.json(
              { ok: false, error: `Failed to fetch CSV: ${res.status} ${res.statusText}` },
              { status: 502 }
            );
          }
          csvText = await res.text();
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Fetch failed";
          return Response.json({ ok: false, error: msg }, { status: 502 });
        }

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
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
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
