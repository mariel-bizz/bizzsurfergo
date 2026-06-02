const KEY = "bizzsurfer:news_pass_expires_at";

export function getStoredNewsPassExpiry(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    if (!v) return null;
    const n = parseInt(v, 10);
    if (!Number.isFinite(n)) return null;
    if (n <= Date.now()) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return n;
  } catch {
    return null;
  }
}

export function setStoredNewsPassExpiry(expiresAt: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, String(expiresAt));
  } catch {
    // ignore
  }
}

export function hasActiveNewsPass(): boolean {
  return getStoredNewsPassExpiry() !== null;
}
