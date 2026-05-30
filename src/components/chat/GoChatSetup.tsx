import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Plus } from "lucide-react";
import logoOpenAI from "@/assets/llm-openai.png";
import logoClaude from "@/assets/llm-claude.png";
import logoMistral from "@/assets/llm-mistral.png";
import logoPerplexity from "@/assets/llm-perplexity.png";
import logoGemini from "@/assets/llm-gemini.png";

export type Provider = "openai" | "claude" | "mistral" | "perplexity" | "gemini";

export type GoChatConfig = {
  provider: Provider;
  departments: string[];
  industries: string[];
};

const PROVIDERS: { id: Provider; name: string; logo: string }[] = [
  { id: "openai", name: "OpenAI", logo: logoOpenAI },
  { id: "claude", name: "Claude", logo: logoClaude },
  { id: "mistral", name: "Mistral AI", logo: logoMistral },
  { id: "perplexity", name: "Perplexity", logo: logoPerplexity },
  { id: "gemini", name: "Gemini", logo: logoGemini },
];

const DEPARTMENTS = ["HR", "Sales", "Marketing", "IT", "Supply Chain", "Procurement", "Operations", "Finance", "Customer Service", "R&D"];
const INDUSTRIES = ["Pharma", "Retail", "Non-Profit", "FMCG", "Beauty & Wellness", "Tech", "SaaS", "Deep Tech", "Financial Services", "Manufacturing"];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-soft"
          : "bg-card text-card-foreground border-border hover:border-primary/40"
      }`}
    >
      {active && <Check className="w-3 h-3" />}
      {children}
    </button>
  );
}

export function GoChatSetup({ onComplete }: { onComplete: (cfg: GoChatConfig) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [otherDept, setOtherDept] = useState("");
  const [showOtherDept, setShowOtherDept] = useState(false);
  const [industries, setIndustries] = useState<string[]>([]);
  const [otherInd, setOtherInd] = useState("");
  const [showOtherInd, setShowOtherInd] = useState(false);

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const finish = () => {
    const finalDepts = [...departments, ...(otherDept.trim() ? [`Other: ${otherDept.trim()}`] : [])];
    const finalInds = [...industries, ...(otherInd.trim() ? [`Other: ${otherInd.trim()}`] : [])];
    onComplete({ provider: provider!, departments: finalDepts, industries: finalInds });
  };

  return (
    <div className="px-5 pt-4 pb-8 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {step === 1 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Choose your Language Model</h2>
            <p className="text-xs text-muted-foreground">All five are <span className="font-extrabold bg-[linear-gradient(90deg,#1D4ED8,#F28328)] bg-clip-text text-transparent">FREE</span> with BizzSurfer GO!</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  provider === p.id ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-transparent flex items-center justify-center shrink-0">
                  <img src={p.logo} alt={`${p.name} logo`} className="w-8 h-8 object-contain" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{p.name}</p>
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest bg-[linear-gradient(90deg,#1D4ED8,#F28328)] bg-clip-text text-transparent drop-shadow-sm">FREE</span>
              </button>
            ))}
          </div>
          <Button disabled={!provider} onClick={() => setStep(2)} className="w-full rounded-md bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95 h-12 text-lg font-extrabold px-[20px] border-[#ff6f00] border-2 border-solid">
            Continue
          </Button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Which transformation?</h2>
            <p className="text-xs text-muted-foreground">Pick all departments involved.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {DEPARTMENTS.map((d) => (
              <Chip key={d} active={departments.includes(d)} onClick={() => toggle(departments, d, setDepartments)}>
                {d}
              </Chip>
            ))}
            {!showOtherDept ? (
              <Chip active={false} onClick={() => setShowOtherDept(true)}>
                <Plus className="w-3 h-3" /> Other
              </Chip>
            ) : (
              <div className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/5 px-2 py-1">
                <input
                  autoFocus
                  value={otherDept}
                  onChange={(e) => setOtherDept(e.target.value)}
                  placeholder="Specify…"
                  className="bg-transparent text-xs font-semibold w-32 focus:outline-none"
                />
                <button onClick={() => { setShowOtherDept(false); setOtherDept(""); }} aria-label="Cancel">
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="rounded-md flex-1 h-12 text-base font-bold border-2">Back</Button>
            <Button
              disabled={departments.length === 0 && !otherDept.trim()}
              onClick={() => setStep(3)}
              className="rounded-md flex-1 bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95 h-12 text-base font-extrabold border-[#ff6f00] border-2 border-solid"
            >
              Continue
            </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Which industry?</h2>
            <p className="text-xs text-muted-foreground">Pick all that apply.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((d) => (
              <Chip key={d} active={industries.includes(d)} onClick={() => toggle(industries, d, setIndustries)}>
                {d}
              </Chip>
            ))}
            {!showOtherInd ? (
              <Chip active={false} onClick={() => setShowOtherInd(true)}>
                <Plus className="w-3 h-3" /> Other
              </Chip>
            ) : (
              <div className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/5 px-2 py-1">
                <input
                  autoFocus
                  value={otherInd}
                  onChange={(e) => setOtherInd(e.target.value)}
                  placeholder="Specify…"
                  className="bg-transparent text-xs font-semibold w-32 focus:outline-none"
                />
                <button onClick={() => { setShowOtherInd(false); setOtherInd(""); }} aria-label="Cancel">
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep(2)} className="rounded-2xl flex-1">Back</Button>
            <Button
              disabled={industries.length === 0 && !otherInd.trim()}
              onClick={finish}
              className="rounded-md flex-1 bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95 h-12 text-lg font-extrabold px-[20px] border-[#ff6f00] border-2 border-solid"
            >
              Start chat
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

export const PROVIDER_META = PROVIDERS;
