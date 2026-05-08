import { useEffect, useState } from "react";
import { SplashScreen } from "./SplashScreen";
import { BottomNav } from "./BottomNav";
import { HomeTab } from "./tabs/HomeTab";
import { ChatTab } from "./tabs/ChatTab";
import { EventsTab } from "./tabs/EventsTab";
import { PricingTab } from "./tabs/PricingTab";
import { ProfileTab } from "./tabs/ProfileTab";
import { Toaster } from "@/components/ui/sonner";
import logo from "@/assets/bizzsurfer-logo.webp";

export type TabKey = "home" | "chat" | "events" | "pricing" | "profile";

const STORAGE = "bizzsurfer_state";

export type GameState = {
  xp: number;
  streak: number;
  badges: string[];
  questionsAsked: number;
  lastVisit: string | null;
};

const defaultState: GameState = { xp: 0, streak: 0, badges: [], questionsAsked: 0, lastVisit: null };

export function useGameState() {
  const [state, setState] = useState<GameState>(defaultState);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE);
      const parsed: GameState = raw ? JSON.parse(raw) : defaultState;
      const today = new Date().toDateString();
      if (parsed.lastVisit !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = parsed.lastVisit === yesterday ? parsed.streak + 1 : 1;
        const newState = { ...parsed, streak: newStreak, lastVisit: today, xp: parsed.xp + 10 };
        if (newStreak >= 3 && !newState.badges.includes("Consistency")) newState.badges.push("Consistency");
        setState(newState);
        localStorage.setItem(STORAGE, JSON.stringify(newState));
      } else {
        setState(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  const update = (partial: Partial<GameState> | ((s: GameState) => GameState)) => {
    setState((prev) => {
      const next = typeof partial === "function" ? partial(prev) : { ...prev, ...partial };
      if (typeof window !== "undefined") localStorage.setItem(STORAGE, JSON.stringify(next));
      return next;
    });
  };

  return { state, update };
}

export function AppShell() {
  const [splash, setSplash] = useState(true);
  const [tab, setTab] = useState<TabKey>("home");
  const game = useGameState();

  return (
    <div className="min-h-screen bg-background relative">
      {splash && <SplashScreen onDone={() => setSplash(false)} />}

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border">
        <div className="mx-auto max-w-md flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="w-9 h-9 object-contain" />
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">BizzSurfer</p>
              <p className="text-base font-bold text-foreground -mt-0.5">Go!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1">
              <span className="text-xs">🔥</span>
              <span className="text-xs font-bold text-accent-foreground">{game.state.streak}</span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-gradient-primary px-2.5 py-1 shadow-soft">
              <span className="text-xs">⚡</span>
              <span className="text-xs font-bold text-primary-foreground">{game.state.xp} XP</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md pb-28">
        {tab === "home" && <HomeTab onNavigate={setTab} game={game} />}
        {tab === "chat" && <ChatTab game={game} />}
        {tab === "events" && <EventsTab game={game} />}
        {tab === "pricing" && <PricingTab />}
        {tab === "profile" && <ProfileTab game={game} />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
      <Toaster position="top-center" />
    </div>
  );
}
