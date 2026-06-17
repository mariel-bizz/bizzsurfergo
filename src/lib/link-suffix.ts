/**
 * Branded slug suffix appended to all event and insight sublinks so the
 * URLs are self-identifying when shared. Loaders strip this suffix before
 * looking up the underlying record, so bare slugs keep working too.
 */
export const BIZZSURFER_SUFFIX = "-bizzsurfer";

export function withBizzSuffix(slug: string): string {
  if (!slug) return slug;
  return slug.endsWith(BIZZSURFER_SUFFIX) ? slug : `${slug}${BIZZSURFER_SUFFIX}`;
}

export function stripBizzSuffix(slug: string): string {
  if (!slug) return slug;
  return slug.endsWith(BIZZSURFER_SUFFIX)
    ? slug.slice(0, -BIZZSURFER_SUFFIX.length)
    : slug;
}
