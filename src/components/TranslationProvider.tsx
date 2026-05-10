import { useEffect, useRef } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT"]);
const STORAGE_PREFIX = "bizzsurfer.tx.";

function getLang(): string {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem("bizzsurfer.lang") || "en";
}

function loadCache(lang: string): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + lang);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(lang: string, cache: Record<string, string>) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + lang, JSON.stringify(cache));
  } catch {
    /* quota */
  }
}

function shouldSkip(node: Node): boolean {
  let p: Node | null = node.parentNode;
  while (p) {
    if (p.nodeType === 1) {
      const el = p as HTMLElement;
      if (SKIP_TAGS.has(el.tagName)) return true;
      if (el.hasAttribute("data-no-translate")) return true;
      if (el.getAttribute("contenteditable") === "true") return true;
    }
    p = p.parentNode;
  }
  return false;
}

const ORIGINAL = new WeakMap<Text, string>();

function collectTextNodes(root: Node, out: Text[]) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const text = n.nodeValue || "";
      if (!text.trim()) return NodeFilter.FILTER_REJECT;
      if (shouldSkip(n)) return NodeFilter.FILTER_REJECT;
      // skip pure numbers/symbols
      if (!/[a-zA-Z]/.test(text)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) out.push(n as Text);
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const langRef = useRef<string>(getLang());
  const cacheRef = useRef<Record<string, string>>(loadCache(langRef.current));
  const pendingRef = useRef<Set<string>>(new Set());
  const inflightRef = useRef<boolean>(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const flushTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyToNode = (node: Text) => {
      const original = ORIGINAL.get(node) ?? node.nodeValue ?? "";
      if (!ORIGINAL.has(node)) ORIGINAL.set(node, original);
      const trimmed = original.trim();
      if (!trimmed) return;
      const lang = langRef.current;
      if (lang === "en") {
        if (node.nodeValue !== original) node.nodeValue = original;
        return;
      }
      const tx = cacheRef.current[trimmed];
      if (tx) {
        const replaced = original.replace(trimmed, tx);
        if (node.nodeValue !== replaced) node.nodeValue = replaced;
      } else {
        pendingRef.current.add(trimmed);
        scheduleFlush();
      }
    };

    const scanAll = (root: Node = document.body) => {
      const nodes: Text[] = [];
      collectTextNodes(root, nodes);
      nodes.forEach(applyToNode);
    };

    const flush = async () => {
      if (inflightRef.current) return;
      const lang = langRef.current;
      if (lang === "en") {
        pendingRef.current.clear();
        return;
      }
      const batch = Array.from(pendingRef.current).slice(0, 50);
      if (batch.length === 0) return;
      batch.forEach((s) => pendingRef.current.delete(s));
      inflightRef.current = true;
      try {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/translate-ui`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ANON}`,
          },
          body: JSON.stringify({ texts: batch, target: lang }),
        });
        if (resp.ok) {
          const data = await resp.json();
          const translations: Record<string, string> = data.translations || {};
          Object.assign(cacheRef.current, translations);
          saveCache(lang, cacheRef.current);
          // re-apply on whole DOM
          scanAll();
        }
      } catch (e) {
        console.warn("translate-ui failed", e);
      } finally {
        inflightRef.current = false;
        if (pendingRef.current.size > 0) scheduleFlush();
      }
    };

    const scheduleFlush = () => {
      if (flushTimerRef.current) window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = window.setTimeout(flush, 250);
    };

    // initial scan
    scanAll();

    // watch DOM mutations
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 3) applyToNode(n as Text);
          else if (n.nodeType === 1) scanAll(n);
        });
        if (m.type === "characterData" && m.target.nodeType === 3) {
          const t = m.target as Text;
          // user-driven changes update the original baseline
          if (!ORIGINAL.has(t) || langRef.current === "en") {
            ORIGINAL.set(t, t.nodeValue ?? "");
          }
          applyToNode(t);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    observerRef.current = observer;

    // listen for language changes
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bizzsurfer.lang" && e.newValue) {
        langRef.current = e.newValue;
        cacheRef.current = loadCache(e.newValue);
        scanAll();
      }
    };
    window.addEventListener("storage", onStorage);

    const onLangChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) {
        langRef.current = detail;
        cacheRef.current = loadCache(detail);
        scanAll();
      }
    };
    window.addEventListener("bizzsurfer:lang", onLangChange as EventListener);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bizzsurfer:lang", onLangChange as EventListener);
      if (flushTimerRef.current) window.clearTimeout(flushTimerRef.current);
    };
  }, []);

  return <>{children}</>;
}

export function setAppLanguage(lang: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("bizzsurfer.lang", lang);
  window.dispatchEvent(new CustomEvent("bizzsurfer:lang", { detail: lang }));
}
