import { Home, MessageCircle, Calendar, Tag, User } from "lucide-react";
import type { TabKey } from "./AppShell";

const tabs: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "chat", label: "Go!", icon: MessageCircle },
  { key: "events", label: "Events", icon: Calendar },
  { key: "pricing", label: "Pricing", icon: Tag },
  { key: "profile", label: "Profile", icon: User },
];

export function BottomNav({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-md bg-card/90 backdrop-blur-xl border-t border-border shadow-elegant">
      <div className="grid grid-cols-5">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          const isChat = key === "chat";
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="relative flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors"
            >
              {isChat ? (
                <div className={`-mt-7 w-14 h-14 rounded-full flex items-center justify-center bg-gradient-primary shadow-elegant ${isActive ? "animate-pulse-ring" : ""}`}>
                  <Icon className="w-7 h-7 text-primary-foreground" strokeWidth={2.4} />
                </div>
              ) : (
                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} strokeWidth={isActive ? 2.4 : 2} />
              )}
              <span className={`text-[10px] font-semibold ${isActive ? "text-primary" : "text-muted-foreground"} ${isChat ? "mt-1" : ""}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
