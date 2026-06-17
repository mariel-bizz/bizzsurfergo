/**
 * Convert a title into a URL-safe kebab-case ASCII slug.
 */
export function slugify(input: string): string {
  return (input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Build a Map<slug, item> from a list of items, deduping collisions
 * by appending the item id when two items would share a slug.
 */
export function buildSlugMap<T>(
  items: readonly T[],
  getTitle: (item: T) => string,
  getId: (item: T) => string | number,
): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    const base = slugify(getTitle(item)) || String(getId(item));
    let slug = base;
    if (map.has(slug)) {
      slug = `${base}-${getId(item)}`;
    }
    map.set(slug, item);
  }
  return map;
}
