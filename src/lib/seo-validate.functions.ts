import { createServerFn } from "@tanstack/react-start";

export type Severity = "error" | "warning" | "info";
export type ValidationIssue = { schema: string; severity: Severity; message: string };
export type ValidationResult = {
  url: string;
  status: number;
  fetchedAt: string;
  jsonLdBlocks: number;
  detected: { breadcrumbs: number; faqs: number; other: string[] };
  issues: ValidationIssue[];
  rawSchemas: string;
};

function extractJsonLd(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      blocks.push({ __parseError: true, raw: raw.slice(0, 200) });
    }
  }
  return blocks;
}

function flatten(node: unknown): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const visit = (n: unknown) => {
    if (!n) return;
    if (Array.isArray(n)) return n.forEach(visit);
    if (typeof n !== "object") return;
    const obj = n as Record<string, unknown>;
    if (Array.isArray(obj["@graph"])) (obj["@graph"] as unknown[]).forEach(visit);
    else out.push(obj);
  };
  visit(node);
  return out;
}

function typeOf(o: Record<string, unknown>): string[] {
  const t = o["@type"];
  if (!t) return [];
  return Array.isArray(t) ? (t as string[]) : [t as string];
}

function validateBreadcrumb(o: Record<string, unknown>, issues: ValidationIssue[]) {
  const items = o.itemListElement;
  if (!Array.isArray(items) || items.length === 0) {
    issues.push({ schema: "BreadcrumbList", severity: "error", message: "itemListElement missing or empty" });
    return;
  }
  if (items.length < 2) {
    issues.push({
      schema: "BreadcrumbList",
      severity: "warning",
      message: `Only ${items.length} item — Google ignores single-item breadcrumbs`,
    });
  }
  const positions: number[] = [];
  items.forEach((raw, i) => {
    const it = raw as Record<string, unknown>;
    const idx = i + 1;
    if (!typeOf(it).includes("ListItem"))
      issues.push({ schema: "BreadcrumbList", severity: "error", message: `Item ${idx}: @type must be "ListItem"` });
    if (typeof it.position !== "number")
      issues.push({ schema: "BreadcrumbList", severity: "error", message: `Item ${idx}: missing numeric "position"` });
    else positions.push(it.position);
    if (!it.name || typeof it.name !== "string")
      issues.push({ schema: "BreadcrumbList", severity: "error", message: `Item ${idx}: missing "name"` });
    const item = it.item;
    const url = typeof item === "string" ? item : (item as Record<string, unknown>)?.["@id"];
    if (i < items.length - 1 && (!url || typeof url !== "string"))
      issues.push({ schema: "BreadcrumbList", severity: "error", message: `Item ${idx}: missing "item" URL` });
    if (typeof url === "string" && !/^https?:\/\//i.test(url))
      issues.push({ schema: "BreadcrumbList", severity: "warning", message: `Item ${idx}: URL should be absolute` });
  });
  const sorted = [...positions].sort((a, b) => a - b);
  if (sorted.some((p, i) => p !== i + 1))
    issues.push({ schema: "BreadcrumbList", severity: "warning", message: `Positions should be sequential 1..n (got ${positions.join(",")})` });
  const urls = items.map((raw) => {
    const it = raw as Record<string, unknown>;
    const item = it.item;
    return typeof item === "string" ? item : (item as Record<string, unknown>)?.["@id"];
  }).filter(Boolean);
  if (new Set(urls).size !== urls.length)
    issues.push({ schema: "BreadcrumbList", severity: "warning", message: "Breadcrumb item URLs are not unique" });
}

function validateFAQ(o: Record<string, unknown>, issues: ValidationIssue[]) {
  const main = o.mainEntity;
  if (!Array.isArray(main) || main.length === 0) {
    issues.push({ schema: "FAQPage", severity: "error", message: "mainEntity missing or empty" });
    return;
  }
  main.forEach((raw, i) => {
    const q = raw as Record<string, unknown>;
    const idx = i + 1;
    if (!typeOf(q).includes("Question"))
      issues.push({ schema: "FAQPage", severity: "error", message: `Q${idx}: @type must be "Question"` });
    if (!q.name || typeof q.name !== "string")
      issues.push({ schema: "FAQPage", severity: "error", message: `Q${idx}: missing "name" (question text)` });
    const a = q.acceptedAnswer as Record<string, unknown> | undefined;
    if (!a) {
      issues.push({ schema: "FAQPage", severity: "error", message: `Q${idx}: missing "acceptedAnswer"` });
      return;
    }
    if (!typeOf(a).includes("Answer"))
      issues.push({ schema: "FAQPage", severity: "error", message: `Q${idx}: acceptedAnswer @type must be "Answer"` });
    if (!a.text || typeof a.text !== "string")
      issues.push({ schema: "FAQPage", severity: "error", message: `Q${idx}: acceptedAnswer missing "text"` });
  });
}

export const validateStructuredData = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => {
    if (!data?.url || !/^https?:\/\//i.test(data.url)) throw new Error("Provide an absolute http(s) URL");
    return data;
  })
  .handler(async ({ data }): Promise<ValidationResult> => {
    const res = await fetch(data.url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; LovableSEOBot/1.0)" },
      redirect: "follow",
    });
    const html = await res.text();
    const blocks = extractJsonLd(html);
    const flat = blocks.flatMap(flatten);

    const issues: ValidationIssue[] = [];
    const detected = { breadcrumbs: 0, faqs: 0, other: [] as string[] };

    for (const b of blocks) {
      if (b && typeof b === "object" && (b as Record<string, unknown>).__parseError) {
        issues.push({ schema: "JSON-LD", severity: "error", message: "Invalid JSON in a <script type=application/ld+json> block" });
      }
    }

    for (const o of flat) {
      const types = typeOf(o);
      if (types.includes("BreadcrumbList")) {
        detected.breadcrumbs++;
        validateBreadcrumb(o, issues);
      } else if (types.includes("FAQPage")) {
        detected.faqs++;
        validateFAQ(o, issues);
      } else {
        types.forEach((t) => detected.other.push(t));
      }
    }

    if (detected.breadcrumbs === 0)
      issues.push({ schema: "BreadcrumbList", severity: "info", message: "No BreadcrumbList found on this page" });
    if (detected.faqs === 0)
      issues.push({ schema: "FAQPage", severity: "info", message: "No FAQPage found on this page" });

    return {
      url: data.url,
      status: res.status,
      fetchedAt: new Date().toISOString(),
      jsonLdBlocks: blocks.length,
      detected,
      issues,
      rawSchemas: flat,
    };
  });
