const KEY = "bizzsurfer:news_pass_expires_at";
const SID_KEY = "bizzsurfer:news_pass_session_id";

export function getStoredNewsPassExpiry(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    if (!v) return null;
    const n = parseInt(v, 10);
    if (!Number.isFinite(n)) return null;
    if (n <= Date.now()) {
      window.localStorage.removeItem(KEY);
      window.localStorage.removeItem(SID_KEY);
      return null;
    }
    return n;
  } catch {
    return null;
  }
}

export function setStoredNewsPassExpiry(expiresAt: number, sessionId?: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, String(expiresAt));
    if (sessionId && /^[a-zA-Z0-9_]+$/.test(sessionId)) {
      window.localStorage.setItem(SID_KEY, sessionId);
    }
  } catch {
    // ignore
  }
}

export function getStoredNewsPassSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(SID_KEY);
    return v && /^[a-zA-Z0-9_]+$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

export function hasActiveNewsPass(): boolean {
  return getStoredNewsPassExpiry() !== null;
}
