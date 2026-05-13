// Lightweight analytics helper. Emits to any provider available on window
// (gtag, plausible, posthog, dataLayer) and always logs to console for visibility.
type Props = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, opts?: { props?: Props }) => void;
    posthog?: { capture: (event: string, props?: Props) => void };
    dataLayer?: unknown[];
  }
}

export function trackEvent(event: string, props: Props = {}) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, props);
    window.plausible?.(event, { props });
    window.posthog?.capture(event, props);
    window.dataLayer?.push({ event, ...props });
    // eslint-disable-next-line no-console
    console.info(`[analytics] ${event}`, props);
  } catch (e) {
    console.warn("analytics error", e);
  }
}
