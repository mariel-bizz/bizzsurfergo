import { useGame } from "../AppShell";
import { Trophy, Flame, Zap, Award, Target, MessageCircle, Calendar, Rocket, Sparkles } from "lucide-react";

const ALL_BADGES = [
  { id: "First Question", label: "First Question", icon: MessageCircle, desc: "Asked your first question to BizzSurfer Go!" },
  { id: "Curious Mind", label: "Curious Mind", icon: Sparkles, desc: "Asked 5+ executive questions" },
  { id: "Strategic Thinker", label: "Strategic Thinker", icon: Target, desc: "Asked 15+ executive questions" },
  { id: "Consistency", label: "Consistency", icon: Flame, desc: "3-day visit streak" },
  { id: "Event Insider", label: "Event Insider", icon: Calendar, desc: "Registered for an executive event" },
  { id: "Early Adopter", label: "Early Adopter", icon: Rocket, desc: "Joined the Agentic AI launch waitlist" },
];

export function ProfileTab() {
  const game = useGame();
  const level = Math.floor(game.state.xp / 100) + 1;
  const xpInLevel = game.state.xp % 100;

  return (
    <div className="px-5 py-5 space-y-5">
      {/* Profile header */}
      <div className="rounded-3xl bg-gradient-deep p-6 text-primary-foreground shadow-elegant relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl font-bold">
            🏄
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest opacity-80 font-semibold">Executive Surfer</p>
            <p className="text-xl font-bold">Level {level}</p>
            <p className="text-xs opacity-90 mt-0.5">Keep riding the Agentic wave</p>
          </div>
        </div>
        <div className="relative mt-4">
          <div className="flex justify-between text-[10px] uppercase tracking-widest opacity-90 mb-1.5 font-semibold">
            <span>{xpInLevel} / 100 XP</span>
            <span>Next: Level {level + 1}</span>
          </div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${xpInLevel}%` }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Zap} value={game.state.xp} label="Total XP" />
        <Stat icon={Flame} value={game.state.streak} label="Day streak" />
        <Stat icon={MessageCircle} value={game.state.questionsAsked} label="Questions" />
      </div>

      {/* Daily missions */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Daily missions</h2>
        <div className="space-y-2">
          <Mission label="Open BizzSurfer Go!" reward={10} done />
          <Mission label="Ask one question to the AI advisor" reward={15} done={game.state.questionsAsked > 0} />
          <Mission label="Read one FAQ" reward={5} />
          <Mission label="Register for an event" reward={25} done={game.state.badges.includes("Event Insider")} />
        </div>
      </div>

      {/* Badges */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" /> Badges
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {ALL_BADGES.map((b) => {
            const earned = game.state.badges.includes(b.id);
            return (
              <div key={b.id} className={`rounded-2xl p-3 text-center border ${
                earned ? "bg-gradient-primary text-primary-foreground border-primary shadow-soft" : "bg-card border-border opacity-60"
              }`}>
                <b.icon className="w-6 h-6 mx-auto" />
                <p className="text-[11px] font-bold mt-1.5 leading-tight">{b.label}</p>
                <p className={`text-[9px] mt-1 leading-tight ${earned ? "opacity-90" : "text-muted-foreground"}`}>{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Zap; value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-3 text-center shadow-card">
      <Icon className="w-5 h-5 text-primary mx-auto" />
      <p className="text-xl font-bold text-foreground mt-1">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
    </div>
  );
}

function Mission({ label, reward, done }: { label: string; reward: number; done?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl p-3 border ${done ? "bg-success/10 border-success/30" : "bg-card border-border"}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
        {done ? "✓" : <Award className="w-4 h-4" />}
      </div>
      <p className="flex-1 text-sm font-medium text-foreground">{label}</p>
      <span className={`text-xs font-bold ${done ? "text-success" : "text-primary"}`}>+{reward} XP</span>
    </div>
  );
}
