import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/bizzsurfer-logo.png";

const OUTBOUND_URL = "https://www.bizzsurfer.com";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧", greeting: "Hi" },
  { code: "es", label: "Español", flag: "🇪🇸", greeting: "Hola" },
  { code: "fr", label: "Français", flag: "🇫🇷", greeting: "Salut" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", greeting: "Hallo" },
  { code: "pt", label: "Português", flag: "🇵🇹", greeting: "Olá" },
  { code: "it", label: "Italiano", flag: "🇮🇹", greeting: "Ciao" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱", greeting: "Hoi" },
  { code: "zh", label: "中文", flag: "🇨🇳", greeting: "你好" },
  { code: "ja", label: "日本語", flag: "🇯🇵", greeting: "こんにちは" },
];

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
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedName = window.localStorage.getItem("bs_visitor_name");
      const savedLang = window.localStorage.getItem("bs_visitor_lang");
      if (savedName) setName(savedName);
      if (savedLang) setLanguage(savedLang);
    } catch {
      // ignore
    }
  }, []);

  const selectedLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  const handleContinue = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("bs_visitor_name", name.trim().slice(0, 60));
        window.localStorage.setItem("bs_visitor_lang", language);
      } catch {
        // ignore
      }
    }
    setFade(true);
    setTimeout(onDone, 300);
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-gradient-wave transition-opacity duration-500 py-8 px-5 ${fade ? "opacity-0" : "opacity-100"}`}>
      <a
        href={OUTBOUND_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open bizzsurfer.com"
        onClick={() => { void trackOutboundClick("splash_logo"); }}
        onAuxClick={() => { void trackOutboundClick("splash_logo"); }}
        className="relative animate-float mt-4"
      >
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl" />
        <img src={logo} alt="BizzSurfer" className="relative w-32 h-32 object-contain" />
      </a>

      <div className="mt-1 text-center max-w-sm">
        <p className="mb-3 text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-primary bg-clip-text text-transparent drop-shadow-sm animate-float">
          BizzSurfer <span className="italic">Go!</span>
        </p>
        <h1 className="text-xl font-bold text-foreground text-balance leading-tight">
          {selectedLang.greeting}{name.trim() ? `, ${name.trim()}` : ""} 👋
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Agentic AI Intelligence for Business Transformation
        </p>
      </div>

      <div className="mt-6 w-full max-w-sm rounded-2xl bg-card/80 backdrop-blur border border-border p-4 shadow-card space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="splash-name" className="text-xs font-semibold">Your name</Label>
          <Input
            id="splash-name"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            autoComplete="given-name"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Choose your language</Label>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((l) => {
              const active = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  aria-pressed={active}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 transition-all ${
                    active
                      ? "border-primary bg-primary/10 shadow-soft"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <span className="text-2xl leading-none" aria-hidden>{l.flag}</span>
                  <span className={`text-[11px] font-semibold ${active ? "text-primary" : "text-foreground"}`}>
                    {l.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Button
        size="lg"
        onClick={handleContinue}
        className="mt-6 bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95 h-12 px-6 text-sm font-bold"
      >
        Continue to BizzSurfer Go <ArrowRight className="ml-1 w-4 h-4" />
      </Button>
    </div>
  );
}
