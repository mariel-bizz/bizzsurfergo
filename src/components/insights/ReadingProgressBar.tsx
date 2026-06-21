import { useEffect, useState } from "react";

/**
 * Sticky top-of-viewport bar that fills as the user scrolls.
 * UI affordance only — nothing persisted.
 */
export function ReadingProgressBar() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      setPct(p);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div aria-hidden className="fixed left-0 right-0 top-0 z-50 h-1 bg-transparent">
      <div
        className="h-full bg-primary transition-[width] duration-150"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
