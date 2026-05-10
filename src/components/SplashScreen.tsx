import { useEffect, useState } from "react";
import { ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logo from "@/assets/bizzsurfer-go-stacked.png";
import { setAppLanguage } from "@/components/TranslationProvider";

const TILE_LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "nl", label: "Dutch", flag: "🇳🇱" },
  { code: "zh", label: "Mandarin", flag: "🇨🇳" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "pt", label: "Portuguese", flag: "🇵🇹" },
];

const OTHER_LANGUAGES = [
  { code: "bn", label: "বাংলা (Bengali)", flag: "🇧🇩" },
  { code: "ru", label: "Русский (Russian)", flag: "🇷🇺" },
  { code: "ur", label: "اردو (Urdu)", flag: "🇵🇰" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ja", label: "日本語 (Japanese)", flag: "🇯🇵" },
  { code: "sw", label: "Kiswahili", flag: "🇰🇪" },
  { code: "tr", label: "Türkçe (Turkish)", flag: "🇹🇷" },
  { code: "it", label: "Italiano (Italian)", flag: "🇮🇹" },
  { code: "ko", label: "한국어 (Korean)", flag: "🇰🇷" },
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
    setAppLanguage(val);
  };

  const handleContinue = () => {
    setFade(true);
    setTimeout(onDone, 300);
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto bg-gradient-wave transition-opacity duration-500 ${fade ? "opacity-0" : "opacity-100"}`}>
      <div className="min-h-full flex flex-col items-center justify-start px-6 py-8">
        <a href="https://www.bizzsurfer.com" target="_blank" rel="noopener noreferrer" aria-label="Open bizzsurfer.com" className="relative animate-float">
          <div className="absolute inset-0 rounded-full bg-white/40 blur-3xl animate-pulse" />
          <div className="absolute inset-0 rounded-full bg-white/20 blur-2xl" />
          <img src={logo} alt="BizzSurfer Go!" className="relative w-56 h-40 sm:w-72 sm:h-52 object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />
        </a>
        <div className="-mt-1 text-center max-w-sm">
          <h1 className="text-2xl font-bold text-foreground text-balance leading-tight">
            Agentic AI Intelligence for Business Transformation
          </h1>
        </div>

        <div className="mt-6 w-full max-w-md">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            <Globe className="w-3.5 h-3.5" /> Language
          </div>

          <div className="grid grid-cols-3 gap-2">
            {TILE_LANGUAGES.map((l) => {
              const active = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleLanguage(l.code)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-3 backdrop-blur transition shadow-sm ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-soft"
                      : "bg-card/80 border-border hover:bg-card"
                  }`}
                >
                  <span className="text-2xl leading-none" aria-hidden>{l.flag}</span>
                  <span className="text-xs font-semibold">{l.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <Select value={OTHER_LANGUAGES.some((o) => o.code === language) ? language : ""} onValueChange={handleLanguage}>
              <SelectTrigger className="bg-card/80 backdrop-blur border-border h-10">
                <SelectValue placeholder="Or choose another language" />
              </SelectTrigger>
              <SelectContent>
                {OTHER_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    <span className="mr-2" aria-hidden>{l.flag}</span>{l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
    </div>
  );
}
