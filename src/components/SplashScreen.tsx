import { useEffect, useState } from "react";
import { ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logo from "@/assets/bizzsurfer-logo.png";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
];

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false);
  const [language, setLanguage] = useState<string>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("bizzsurfer.lang");
    if (stored) setLanguage(stored);
  }, []);

  const handleLanguage = (val: string) => {
    setLanguage(val);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("bizzsurfer.lang", val);
    }
  };

  const handleContinue = () => {
    setFade(true);
    setTimeout(onDone, 300);
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-wave transition-opacity duration-500 ${fade ? "opacity-0" : "opacity-100"}`}>
      <a href="https://www.bizzsurfer.com" target="_blank" rel="noopener noreferrer" aria-label="Open bizzsurfer.com" className="relative animate-float">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl" />
        <img src={logo} alt="BizzSurfer" className="relative w-44 h-44 object-contain" />
      </a>
      <div className="mt-8 px-8 text-center max-w-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-3">BizzSurfer Go!</p>
        <h1 className="text-2xl font-bold text-foreground text-balance leading-tight">
          Agentic AI Intelligence for Business Transformation
        </h1>
      </div>

      <div className="mt-6 w-64">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
          <Globe className="w-3.5 h-3.5" /> Language
        </label>
        <Select value={language} onValueChange={handleLanguage}>
          <SelectTrigger className="bg-card/80 backdrop-blur border-border h-10">
            <SelectValue placeholder="Choose language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        size="lg"
        onClick={handleContinue}
        className="mt-6 bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95 h-12 px-6 text-sm font-bold"
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
