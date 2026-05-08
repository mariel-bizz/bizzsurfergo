import { useEffect, useState } from "react";
import logo from "@/assets/bizzsurfer-logo.webp";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 1900);
    const t2 = setTimeout(onDone, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-wave transition-opacity duration-500 ${fade ? "opacity-0" : "opacity-100"}`}>
      <div className="relative animate-float">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl" />
        <img src={logo} alt="BizzSurfer" className="relative w-44 h-44 object-contain" />
      </div>
      <div className="mt-8 px-8 text-center max-w-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-3">BizzSurfer Go!</p>
        <h1 className="text-2xl font-bold text-foreground text-balance leading-tight">
          Agentic AI Intelligence for Business Transformation
        </h1>
      </div>
      <div className="mt-10 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
        ))}
      </div>
    </div>
  );
}
