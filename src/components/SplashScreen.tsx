import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/bizzsurfer-logo.png";

const OUTBOUND_URL = "https://www.bizzsurfer.com";

async function trackOutboundClick(source: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("outbound_clicks").insert({
      source,
      destination: OUTBOUND_URL,
      user_id: user?.id ?? null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      path: typeof window !== "undefined" ? window.location.pathname : null,
    });
  } catch (err) {
    console.warn("outbound click tracking failed", err);
  }
}

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 1900);
    const t2 = setTimeout(onDone, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  const handleContinue = () => {
    setFade(true);
    setTimeout(onDone, 300);
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-wave transition-opacity duration-500 ${fade ? "opacity-0" : "opacity-100"}`}>
      <a
        href={OUTBOUND_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open bizzsurfer.com"
        onClick={() => { void trackOutboundClick("splash_logo"); }}
        onAuxClick={() => { void trackOutboundClick("splash_logo"); }}
        className="relative animate-float"
      >
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl" />
        <img src={logo} alt="BizzSurfer" className="relative w-44 h-44 object-contain" />
      </a>
      <div className="mt-8 px-8 text-center max-w-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-3">BizzSurfer Go!</p>
        <h1 className="text-2xl font-bold text-foreground text-balance leading-tight">
          Agentic AI Intelligence for Business Transformation
        </h1>
      </div>
      <Button
        size="lg"
        onClick={handleContinue}
        className="mt-8 bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95 h-12 px-6 text-sm font-bold"
      >
        Continue to BizzSurfer Go <ArrowRight className="ml-1 w-4 h-4" />
      </Button>
      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
        ))}
      </div>
    </div>
  );
}
