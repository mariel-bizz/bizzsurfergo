import type { Document } from "@contentful/rich-text-types";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/contentful";

export type BlogPostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string | null;
  author: string | null;
  publishedDate: string | null;
  featuredImage: { url: string; alt: string; width?: number; height?: number } | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

export type BlogPostDetail = BlogPostSummary & {
  body: Document | null;
};

type Asset = {
  sys: { id: string };
  fields: {
    title?: string;
    description?: string;
    file?: {
      url: string;
      details?: { image?: { width: number; height: number } };
    };
  };
};

type Entry<T> = {
  sys: { id: string };
  fields: T;
};

type FieldShape = {
  title?: string;
  slug?: string;
  excerpt?: string;
  body?: Document;
  featuredImage?: { sys: { id: string } };
  category?: string;
  author?: string;
  publishedDate?: string;
  metaTitle?: string;
  metaDescription?: string;
};

function gatewayHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const apiKey = process.env.CONTENTFUL_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!apiKey) throw new Error("CONTENTFUL_API_KEY is not configured");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": apiKey,
  };
}

function spaceId() {
  const id = process.env.CONTENTFUL_SPACE_ID;
  if (!id) throw new Error("CONTENTFUL_SPACE_ID is not configured");
  return id;
}

function envId() {
  return process.env.CONTENTFUL_ENVIRONMENT || "master";
}

function resolveImage(
  ref: { sys: { id: string } } | undefined,
  assets: Map<string, Asset>,
): BlogPostSummary["featuredImage"] {
  if (!ref) return null;
  const asset = assets.get(ref.sys.id);
  if (!asset?.fields?.file?.url) return null;
  const url = asset.fields.file.url.startsWith("//")
    ? `https:${asset.fields.file.url}`
    : asset.fields.file.url;
  return {
    url,
    alt: asset.fields.description || asset.fields.title || "",
    width: asset.fields.file.details?.image?.width,
    height: asset.fields.file.details?.image?.height,
  };
}

function toSummary(entry: Entry<FieldShape>, assets: Map<string, Asset>): BlogPostSummary {
  const f = entry.fields;
  return {
    id: entry.sys.id,
    title: f.title || "Untitled",
    slug: f.slug || entry.sys.id,
    excerpt: f.excerpt || "",
    category: f.category || null,
    author: f.author || null,
    publishedDate: f.publishedDate || null,
    featuredImage: resolveImage(f.featuredImage, assets),
    metaTitle: f.metaTitle || null,
    metaDescription: f.metaDescription || null,
  };
}

async function fetchEntries(params: Record<string, string>) {
  const qs = new URLSearchParams({
    content_type: "blogPost",
    include: "2",
    ...params,
  });
  const url = `${GATEWAY_URL}/spaces/${spaceId()}/environments/${envId()}/entries?${qs}`;
  const res = await fetch(url, { headers: gatewayHeaders() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Contentful API failed [${res.status}]: ${body}`);
  }
  const data = (await res.json()) as {
    items: Entry<FieldShape>[];
    includes?: { Asset?: Asset[] };
  };
  const assets = new Map<string, Asset>();
  (data.includes?.Asset || []).forEach((a) => assets.set(a.sys.id, a));
  return { items: data.items, assets };
}

export async function fetchBlogPosts(): Promise<BlogPostSummary[]> {
  const { items, assets } = await fetchEntries({
    order: "-fields.publishedDate",
    limit: "100",
  });
  return items.map((e) => toSummary(e, assets));
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  const { items, assets } = await fetchEntries({
    "fields.slug": slug,
    limit: "1",
  });
  if (!items.length) return null;
  const entry = items[0];
  return {
    ...toSummary(entry, assets),
    body: entry.fields.body || null,
  };
}
