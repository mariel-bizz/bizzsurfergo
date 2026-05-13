import { useEffect, useRef, useState } from "react";
import { useGame } from "../AppShell";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, ExternalLink, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { GoChatSetup, PROVIDER_META, type GoChatConfig } from "@/components/chat/GoChatSetup";

type Msg = { role: "user" | "assistant"; content: string };

const CONFIG_KEY = "bizzsurfer.gochat.config";


const PRESETS = [
  "How do I get my board aligned on an Agentic AI investment case?",
  "Our transformation is 18 months in and adoption is below 35%. What now?",
  "How is Agentic AI different from the AI agents my IT team is piloting?",
  "What KPIs should I report monthly to prove transformation is on track?",
  "How do I reduce change fatigue across middle management?",
  "Where should a CHRO start with Agentic AI in talent and workforce planning?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bizzsurfer-chat`;

export function ChatTab({ seedPrompt }: { seedPrompt?: string } = {}) {
  const game = useGame();
  const [config, setConfig] = useState<GoChatConfig | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(CONFIG_KEY);
      return raw ? (JSON.parse(raw) as GoChatConfig) : null;
    } catch {
      return null;
    }
  });
  const gemPersona = config?.provider === "gemini"
    ? "You are the BizzSurfer Gem — a Gemini-powered Agentic AI transformation advisor for senior leaders. Mirror the tone and structure of a Google Gemini Gem: concise, structured, with crisp headings and bullets. Never tell the user to open Gemini, sign in to Google, or leave this app — you are the Gem, running here."
    : "";
  const contextPreamble = config
    ? `${gemPersona ? gemPersona + "\n\n" : ""}Context: the leader is exploring an Agentic AI transformation in ${config.departments.join(", ")} for the ${config.industries.join(", ")} industry. Tailor every answer to that scope.`
    : "";
  const initialAssistant = config
    ? `I'm **BizzSurfer Go!** — focused on **${config.departments.join(", ")}** in **${config.industries.join(", ")}**. Ask me anything, or pick a starter below.`
    : "I'm **BizzSurfer Go!** — your Agentic AI advisor for business transformation. Ask me anything, or pick a question below to get started.";
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: initialAssistant }]);
  const [input, setInput] = useState(seedPrompt ?? "");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (seedPrompt) setInput(seedPrompt);
  }, [seedPrompt]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const saveConfig = (cfg: GoChatConfig) => {
    try { window.localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
    setConfig(cfg);
    setMessages([{
      role: "assistant",
      content: `Locked in: **${PROVIDER_META.find(p => p.id === cfg.provider)?.name}** for **${cfg.departments.join(", ")}** in **${cfg.industries.join(", ")}**. What's the first question on your board agenda?`,
    }]);
  };

  const resetConfig = () => {
    try { window.localStorage.removeItem(CONFIG_KEY); } catch { /* ignore */ }
    setConfig(null);
    setMessages([{ role: "assistant", content: "Let's reconfigure your BizzSurfer GO! chat." }]);
  };

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    game.update((s) => {
      const q = s.questionsAsked + 1;
      const badges = [...s.badges];
      if (q === 1 && !badges.includes("First Question")) badges.push("First Question");
      if (q >= 5 && !badges.includes("Curious Mind")) badges.push("Curious Mind");
      if (q >= 15 && !badges.includes("Strategic Thinker")) badges.push("Strategic Thinker");
      return { ...s, questionsAsked: q, xp: s.xp + 15, badges };
    });

    let acc = "";
    let assistantStarted = false;
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => {
        if (!assistantStarted) {
          assistantStarted = true;
          return [...prev, { role: "assistant" as const, content: acc }];
        }
        return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: acc } : m);
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: contextPreamble ? [{ role: "system", content: contextPreamble }, ...next] : next,
          provider: config?.provider ?? null,
          language: typeof window !== "undefined" ? window.localStorage.getItem("bizzsurfer.lang") || "en" : "en",
        }),
      });

      if (resp.status === 429) { toast.error("Rate limit reached. Try again shortly."); setStreaming(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted. Add credits to continue."); setStreaming(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Couldn't reach BizzSurfer. Try again.");
    } finally {
      setStreaming(false);
    }
  };

  const providerMeta = config ? PROVIDER_META.find((p) => p.id === config.provider) : null;
  const isGemini = config?.provider === "gemini";

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)]">
      <div className="px-5 pt-3 pb-2">
        <div className="rounded-2xl bg-gradient-primary text-primary-foreground p-4 shadow-soft flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            {providerMeta ? (
              <img src={providerMeta.logo} alt={providerMeta.name} className="w-6 h-6" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest opacity-90 font-semibold">Agentic AI Advisor</p>
            <p className="text-sm font-bold truncate">
              BizzSurfer Go!{providerMeta ? ` · ${providerMeta.name}` : ""}
            </p>
          </div>
          {config ? (
            <button
              onClick={resetConfig}
              className="rounded-lg bg-white/20 backdrop-blur px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1"
              aria-label="Reconfigure"
            >
              <Settings2 className="w-3 h-3" /> Setup
            </button>
          ) : (
            <a
              href="https://chatgpt.com/g/g-69f61861f0308191bdb780fd6adc5085-bizzsurfer"
              target="_blank" rel="noreferrer"
              className="rounded-lg bg-white/20 backdrop-blur px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1"
            >
              GPT <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {!config && <GoChatSetup onComplete={saveConfig} />}

      {config && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-card ${
                  m.role === "user"
                    ? "bg-gradient-primary text-primary-foreground rounded-br-sm"
                    : "bg-card text-card-foreground border border-border rounded-bl-sm"
                }`}>
                  <FormattedText text={m.content} />
                </div>
              </div>
            ))}
            {streaming && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                  {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i*150}ms` }} />)}
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">Try a leader question</p>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
                {PRESETS.map((p) => (
                  <button key={p} onClick={() => send(p)} className="snap-start shrink-0 max-w-[80%] text-left rounded-xl bg-accent text-accent-foreground px-3 py-2 text-xs font-medium border border-primary/20 hover:bg-accent/80 transition">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="px-4 pt-2 pb-3 bg-background border-t border-border">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask via ${providerMeta?.name ?? "BizzSurfer Go!"}…`}
                disabled={streaming}
                className="flex-1 rounded-2xl bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button type="submit" size="icon" disabled={streaming || !input.trim()} className="rounded-2xl w-12 h-12 bg-gradient-primary shadow-soft">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  // Lightweight markdown: **bold**, line breaks, bullets
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const isBullet = /^\s*[-•*]\s+/.test(line);
        const clean = line.replace(/^\s*[-•*]\s+/, "");
        const parts = clean.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className={isBullet ? "pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold" : ""}>
            {parts.map((p, j) => p.startsWith("**") && p.endsWith("**")
              ? <strong key={j} className="font-bold">{p.slice(2, -2)}</strong>
              : <span key={j}>{p}</span>
            )}
          </p>
        );
      })}
    </div>
  );
}
