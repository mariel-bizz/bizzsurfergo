import { createContext, useContext, useEffect, useState } from "react";
import { Outlet, useLocation } from "@tanstack/react-router";
import { SplashScreen } from "./SplashScreen";
import { BottomNav } from "./BottomNav";
import { FloatingChat } from "./FloatingChat";
import { NewsletterDialog } from "./NewsletterDialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import logo from "@/assets/bizzsurfer-logo.png";
import headerLogo from "@/assets/bizzsurfer-go-logo-horizontal.png";

export type TabKey = "home" | "chat" | "events" | "marketplace" | "pricing" | "profile";

const STORAGE = "bizzsurfer_state";

export type OnboardingStep = "chat" | "reality" | "marketplace" | "events" | "profile";

export type OnboardingState = {
  steps: Record<OnboardingStep, boolean>;
  dismissed: boolean;
  completedAt: string | null;
};

export type GameState = {
  xp: number;
  streak: number;
  badges: string[];
  questionsAsked: number;
  lastVisit: string | null;
  onboarding: OnboardingState;
};

const defaultOnboarding: OnboardingState = {
  steps: { chat: false, reality: false, marketplace: false, events: false, profile: false },
  dismissed: false,
  completedAt: null,
};

const defaultState: GameState = {
  xp: 0,
  streak: 0,
  badges: [],
  questionsAsked: 0,
  lastVisit: null,
  onboarding: defaultOnboarding,
};

export type Game = {
  state: GameState;
  update: (p: Partial<GameState> | ((s: GameState) => GameState)) => void;
  completeOnboardingStep: (step: OnboardingStep) => void;
  dismissOnboarding: () => void;
  reopenOnboarding: () => void;
};

function normalizeOnboarding(o: Partial<OnboardingState> | undefined): OnboardingState {
  return {
    steps: { ...defaultOnboarding.steps, ...(o?.steps ?? {}) },
    dismissed: o?.dismissed ?? false,
    completedAt: o?.completedAt ?? null,
  };
}

export function useGameStateInternal(): Game {
  const [state, setState] = useState<GameState>(defaultState);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE);
      const parsed: GameState = raw
        ? { ...defaultState, ...JSON.parse(raw) }
        : defaultState;
      parsed.onboarding = normalizeOnboarding(parsed.onboarding);
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

  const completeOnboardingStep = (step: OnboardingStep) => {
    setState((prev) => {
      if (prev.onboarding.steps[step]) return prev;
      const steps = { ...prev.onboarding.steps, [step]: true };
      const allDone = Object.values(steps).every(Boolean);
      const wasAllDone = !!prev.onboarding.completedAt;
      const badges = [...prev.badges];
      let xp = prev.xp + 25;
      if (allDone && !wasAllDone) {
        xp += 100;
        if (!badges.includes("Launch Crew")) badges.push("Launch Crew");
        trackEvent("onboarding_completed", {});
        // Defer toast so it doesn't fire during render
        setTimeout(() => toast.success("Onboarding complete! +100 XP · Launch Crew badge unlocked"), 0);
      } else {
        setTimeout(() => toast.success("+25 XP · Step complete"), 0);
      }
      trackEvent("onboarding_step_completed", { step });
      const next: GameState = {
        ...prev,
        xp,
        badges,
        onboarding: {
          ...prev.onboarding,
          steps,
          completedAt: allDone ? (prev.onboarding.completedAt ?? new Date().toISOString()) : prev.onboarding.completedAt,
        },
      };
      if (typeof window !== "undefined") localStorage.setItem(STORAGE, JSON.stringify(next));
      return next;
    });
  };

  const dismissOnboarding = () => update((s) => ({ ...s, onboarding: { ...s.onboarding, dismissed: true } }));
  const reopenOnboarding = () => update((s) => ({ ...s, onboarding: { ...s.onboarding, dismissed: false } }));

  return { state, update, completeOnboardingStep, dismissOnboarding, reopenOnboarding };
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

const ROOT_PATHS = new Set(["/", "/index", "/index.html", "/home"]);

export function AppShell() {
  const [splash, setSplash] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = window.location.pathname.replace(/\/+$/, "") || "/";
    if (ROOT_PATHS.has(p)) setSplash(true);
    const handler = () => setSplash(true);
    window.addEventListener("bizzsurfer:open-welcome", handler);
    return () => window.removeEventListener("bizzsurfer:open-welcome", handler);
  }, []);
  const dismissSplash = () => {
    setSplash(false);
  };
  const game = useGameStateInternal();
  const location = useLocation();
  const activeTab: TabKey = PATH_TO_TAB[location.pathname] ?? "home";

  return (
    <GameContext.Provider value={game}>
      <div className="min-h-screen bg-background relative">
        {splash && <SplashScreen onDone={dismissSplash} />}

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border">
          <div className="mx-auto max-w-md flex items-center justify-between gap-2 px-3 sm:px-4 py-2">
            <div className="flex items-center min-w-0 flex-shrink">
              <img
                src={headerLogo}
                alt="BizzSurfer Go!"
                className="h-10 xs:h-11 sm:h-12 md:h-14 lg:h-16 w-auto max-w-[180px] xs:max-w-[220px] sm:max-w-[260px] md:max-w-[300px] lg:max-w-[340px] object-contain shrink-0"
              />
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
          <Outlet />
        </main>

        <FloatingChat />
        <NewsletterDialog />
        <BottomNav active={activeTab} />
        <Toaster position="top-center" />
      </div>
    </GameContext.Provider>
  );
}
