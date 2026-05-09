import { createContext, useContext, useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { SplashScreen } from "./SplashScreen";
import { BottomNav } from "./BottomNav";
import { FloatingChat } from "./FloatingChat";
import { Toaster } from "@/components/ui/sonner";
import logo from "@/assets/bizzsurfer-go-logo-horizontal.png";

export type TabKey = "home" | "chat" | "events" | "marketplace" | "pricing" | "profile";

const STORAGE = "bizzsurfer_state";

export type GameState = {
  xp: number;
  streak: number;
  badges: string[];
  questionsAsked: number;
  lastVisit: string | null;
};

const defaultState: GameState = { xp: 0, streak: 0, badges: [], questionsAsked: 0, lastVisit: null };

export type Game = {
  state: GameState;
  update: (p: Partial<GameState> | ((s: GameState) => GameState)) => void;
};

export function useGameStateInternal(): Game {
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

const GameContext = createContext<Game | null>(null);

export function useGame(): Game {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within AppShell");
  return ctx;
}

const PATH_TO_TAB: Record<string, TabKey> = {
  "/": "home",
  "/chat": "chat",
  "/events": "events",
  "/marketplace": "marketplace",
  "/pricing": "pricing",
  "/profile": "profile",
};

export function AppShell() {
  const [splash, setSplash] = useState(true);
  const game = useGameStateInternal();
  const location = useLocation();
  const activeTab: TabKey = PATH_TO_TAB[location.pathname] ?? "home";

  return (
    <GameContext.Provider value={game}>
      <div className="min-h-screen bg-background relative">
        {splash && <SplashScreen onDone={() => setSplash(false)} />}

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border">
          <div className="mx-auto max-w-md flex items-center justify-between gap-3 px-3 sm:px-4 py-2 sm:py-2.5">
            <Link to="/" className="flex items-center shrink min-w-0" aria-label="BizzSurfer Go! home">
              <img
                src={logo}
                alt="BizzSurfer Go!"
                className="h-7 sm:h-9 w-auto max-w-[180px] sm:max-w-[220px] object-contain"
              />
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="flex items-center gap-1 rounded-full bg-accent px-2 sm:px-2.5 py-1" title={`${game.state.streak} day streak`}>
                <span className="text-xs leading-none">🔥</span>
                <span className="text-[11px] sm:text-xs font-bold text-accent-foreground tabular-nums">{game.state.streak}</span>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-gradient-primary px-2 sm:px-2.5 py-1 shadow-soft" title={`${game.state.xp} XP`}>
                <span className="text-xs leading-none">⚡</span>
                <span className="text-[11px] sm:text-xs font-bold text-primary-foreground tabular-nums">
                  {game.state.xp}
                  <span className="hidden sm:inline"> XP</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-md pb-28">
          <Outlet />
        </main>

        <FloatingChat />
        <BottomNav active={activeTab} />
        <Toaster position="top-center" />
      </div>
    </GameContext.Provider>
  );
}
