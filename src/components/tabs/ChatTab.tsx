import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "../AppShell";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, ExternalLink, Settings2, Paperclip, X, Mail, Download, Zap, Sparkle } from "lucide-react";
import { toast } from "sonner";
import { GoChatSetup, PROVIDER_META, type GoChatConfig, type Provider } from "@/components/chat/GoChatSetup";
import jsPDF from "jspdf";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import bizzsurferGoLogo from "@/assets/bizzsurfer-go-logo.png";
import { trackEvent } from "@/lib/analytics";

// Strict RFC-5322-ish email check + length cap.
const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return "Please enter your email address.";
  if (v.length > 254) return "That email is too long.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email like name@company.com.";
  const [, domain] = v.split("@");
  if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) {
    return "That email domain looks invalid.";
  }
  return null;
}

// Cache the logo as a data URL so jsPDF can embed it.
let logoDataUrl: string | null = null;
async function getLogoDataUrl(): Promise<string | null> {
  if (logoDataUrl) return logoDataUrl;
  try {
    const res = await fetch(bizzsurferGoLogo);
    const blob = await res.blob();
    logoDataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    return logoDataUrl;
  } catch { return null; }
}

type Attachment = { name: string; type: string; dataUrl: string };
type Msg = { role: "user" | "assistant"; content: string; attachments?: Attachment[] };

const CONFIG_KEY = "bizzsurfer.gochat.config";
const QUESTION_LIMIT = 5;

const PRESETS = [
  "How do I get my board aligned on an Agentic AI investment case?",
  "Our transformation is 18 months in and adoption is below 35%. What now?",
  "How is Agentic AI different from the AI agents my IT team is piloting?",
  "What KPIs should I report monthly to prove transformation is on track?",
  "How do I reduce change fatigue across middle management?",
  "Where should a CHRO start with Agentic AI in talent and workforce planning?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bizzsurfer-chat`;

// Light normalisation only — KEEP markdown so we can render bold/lists/paragraphs.
function cleanAnswer(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")          // drop markdown headings (we use paragraphs)
    .replace(/^\s*[•]\s+/gm, "- ");       // normalise stray bullets to markdown lists
}

export function ChatTab({ seedPrompt }: { seedPrompt?: string } = {}) {
  const game = useGame();
  const [config, setConfig] = useState<GoChatConfig | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(CONFIG_KEY);
      return raw ? (JSON.parse(raw) as GoChatConfig) : null;
    } catch { return null; }
  });
  const gemPersona = config?.provider === "gemini"
    ? "You are the BizzSurfer Gem — a Gemini-powered Agentic AI transformation advisor for senior leaders. Mirror the tone and structure of a Google Gemini Gem: concise, structured, with crisp headings and bullets. Never tell the user to open Gemini, sign in to Google, or leave this app — you are the Gem, running here."
    : "";
  const contextPreamble = config
    ? `${gemPersona ? gemPersona + "\n\n" : ""}Context: the leader is exploring an Agentic AI transformation in ${config.departments.join(", ")} for the ${config.industries.join(", ")} industry. Tailor every answer to that scope. Reply in short paragraphs separated by blank lines. Use markdown **bold** to highlight the key terms, metrics and frameworks. Use simple "-" bullets for short lists. Never use markdown headings.`
    : "";
  const initialAssistant = config
    ? `I'm **BizzSurfer Go!** — focused on **${config.departments.join(", ")}** in **${config.industries.join(", ")}**.\n\nAsk me anything, or pick a starter below.`
    : "I'm **BizzSurfer Go!** — your Agentic AI advisor for business transformation.\n\nAsk me anything, or pick a question below to get started.";
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: initialAssistant }]);
  const [input, setInput] = useState(seedPrompt ?? "");
  const [streaming, setStreaming] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load any prior session email to pre-fill the popup.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmailValue(data.user.email);
    });
  }, []);

  useEffect(() => { if (seedPrompt) setInput(seedPrompt); }, [seedPrompt]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const saveConfig = (cfg: GoChatConfig) => {
    try { window.localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
    setConfig(cfg);
    setMessages([{
      role: "assistant",
      content: `Locked in: ${PROVIDER_META.find(p => p.id === cfg.provider)?.name} for ${cfg.departments.join(", ")} in ${cfg.industries.join(", ")}. What's the first question on your board agenda?`,
    }]);
    setQuestionCount(0);
  };

  const switchProvider = (provider: Provider) => {
    if (!config) return;
    const next = { ...config, provider };
    try { window.localStorage.setItem(CONFIG_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setConfig(next);
    toast.success(`Switched to ${PROVIDER_META.find(p => p.id === provider)?.name}`);
  };

  const resetConfig = () => {
    try { window.localStorage.removeItem(CONFIG_KEY); } catch { /* ignore */ }
    setConfig(null);
    setMessages([{ role: "assistant", content: "Let's reconfigure your BizzSurfer GO! chat." }]);
    setQuestionCount(0);
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files) return;
    const items: Attachment[] = [];
    for (const f of Array.from(files).slice(0, 4)) {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} is over 5MB`); continue; }
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(f);
      });
      items.push({ name: f.name, type: f.type, dataUrl });
    }
    setAttachments((prev) => [...prev, ...items].slice(0, 4));
  };

  const send = async (text: string) => {
    if ((!text.trim() && attachments.length === 0) || streaming) return;
    if (questionCount >= QUESTION_LIMIT) { setEmailOpen(true); return; }

    const userMsg: Msg = { role: "user", content: text, attachments: attachments.length ? attachments : undefined };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setAttachments([]);
    setStreaming(true);

    game.update((s) => {
      const q = s.questionsAsked + 1;
      const badges = [...s.badges];
      if (q === 1 && !badges.includes("First Question")) badges.push("First Question");
      if (q >= 5 && !badges.includes("Curious Mind")) badges.push("Curious Mind");
      if (q >= 15 && !badges.includes("Strategic Thinker")) badges.push("Strategic Thinker");
      return { ...s, questionsAsked: q, xp: s.xp + 15, badges };
    });
    game.completeOnboardingStep("chat");

    let acc = "";
    let assistantStarted = false;
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => {
        if (!assistantStarted) {
          assistantStarted = true;
          return [...prev, { role: "assistant" as const, content: cleanAnswer(acc) }];
        }
        return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: cleanAnswer(acc) } : m);
      });
    };

    try {
      // Build payload: attachments are inlined as a brief text reference (vision multi-modal isn't wired in the edge fn).
      const apiMessages = next.map((m) => ({
        role: m.role,
        content: m.attachments?.length
          ? `${m.content}\n\n[Attached files: ${m.attachments.map(a => a.name).join(", ")}]`
          : m.content,
      }));

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: contextPreamble ? [{ role: "system", content: contextPreamble }, ...apiMessages] : apiMessages,
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

      setQuestionCount((c) => {
        const nc = c + 1;
        if (nc >= QUESTION_LIMIT) setTimeout(() => setEmailOpen(true), 800);
        return nc;
      });
    } catch (e) {
      console.error(e);
      toast.error("Couldn't reach BizzSurfer. Try again.");
    } finally {
      setStreaming(false);
    }
  };

  const providerMeta = config ? PROVIDER_META.find((p) => p.id === config.provider) : null;

  // ---- PDF + email summary ----
  const buildSummaryText = () => {
    const lines: string[] = [];
    lines.push("BizzSurfer Go! — Conversation summary");
    if (config) {
      lines.push(`Model: ${PROVIDER_META.find(p => p.id === config.provider)?.name}`);
      lines.push(`Departments: ${config.departments.join(", ")}`);
      lines.push(`Industries: ${config.industries.join(", ")}`);
    }
    lines.push("");
    messages.slice(1).forEach((m) => {
      lines.push(`${m.role === "user" ? "You" : "BizzSurfer"}: ${m.content}`);
      lines.push("");
    });
    return lines.join("\n");
  };

  const downloadPdf = async () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const pageW = doc.internal.pageSize.getWidth();
    const width = pageW - margin * 2;
    const pageH = doc.internal.pageSize.getHeight() - margin;

    // Theme colors (matching app's primary teal palette)
    const PRIMARY: [number, number, number] = [56, 124, 137]; // ~oklch primary
    const MUTED: [number, number, number] = [110, 118, 128];
    const TEXT: [number, number, number] = [25, 30, 36];

    // Header band
    doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.rect(0, 0, pageW, 90, "F");

    // Logo
    const logo = await getLogoDataUrl();
    if (logo) {
      try { doc.addImage(logo, "PNG", margin, 22, 46, 46); } catch { /* ignore */ }
    }

    // Wordmark
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("BizzSurfer Go!", margin + 58, 48);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Agentic AI advisor for business transformation", margin + 58, 64);

    // Title
    let y = 130;
    doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Your conversation report", margin, y); y += 10;
    doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.setLineWidth(2);
    doc.line(margin, y, margin + 48, y); y += 24;

    // Meta block
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(new Date().toLocaleString(), margin, y); y += 14;
    if (config) {
      doc.text(`Model: ${PROVIDER_META.find(p => p.id === config.provider)?.name}`, margin, y); y += 14;
      doc.text(`Departments: ${config.departments.join(", ")}`, margin, y); y += 14;
      doc.text(`Industries: ${config.industries.join(", ")}`, margin, y); y += 22;
    }

    // Conversation
    doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
    doc.setFontSize(11);

    messages.slice(1).forEach((m) => {
      if (y > pageH - 40) { doc.addPage(); y = margin; }
      doc.setFont("helvetica", "bold");
      doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      doc.setFontSize(10);
      doc.text(m.role === "user" ? "YOU" : "BIZZSURFER GO!", margin, y); y += 14;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
      doc.setFontSize(11);
      const body = doc.splitTextToSize(m.content, width);
      body.forEach((l: string) => {
        if (y > pageH) { doc.addPage(); y = margin; }
        doc.text(l, margin, y); y += 15;
      });
      y += 10;
    });

    // CTA card
    if (y > pageH - 110) { doc.addPage(); y = margin; }
    y += 10;
    doc.setFillColor(244, 248, 249);
    doc.roundedRect(margin, y, width, 90, 8, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
    doc.text("Want the full picture?", margin + 14, y + 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text("Upgrade to BizzSurfer Pro for unlimited questions, full reports,", margin + 14, y + 40);
    doc.text("upcoming events and a 1:1 demo call with our team.", margin + 14, y + 54);
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.setFont("helvetica", "bold");
    doc.textWithLink("→ Book a demo call", margin + 14, y + 76, { url: "https://bizzsurfergo.lovable.app/pricing" });

    doc.save("bizzsurfer-go-summary.pdf");
    trackEvent("go_chat_pdf_downloaded", {
      email: submittedEmail || undefined,
      provider: config?.provider,
      messages: messages.length - 1,
    });
  };

  // Step 1: validate + persist email to waitlist, then show inline confirmation.
  const submitEmail = async () => {
    const err = validateEmail(emailValue);
    if (err) { setEmailError(err); return; }
    setEmailError(null);
    setSending(true);
    const cleanEmail = emailValue.trim().toLowerCase();

    try {
      const { error } = await supabase.from("waitlist").insert({
        email: cleanEmail,
        name: cleanEmail.split("@")[0],
        role: `go_chat · ${config?.provider ?? ""} · ${config?.industries.join("/") ?? ""}`,
      });
      if (error && error.code !== "23505") {
        console.warn("waitlist insert:", error.message);
      }
    } catch (e) { /* non-blocking */ }

    trackEvent("go_chat_email_submitted", {
      email: cleanEmail,
      provider: config?.provider,
    });

    setSubmittedEmail(cleanEmail);
    setEmailSubmitted(true);
    setSending(false);
  };

  // Step 2a: trigger the in-browser PDF download.
  const handleDownloadPdf = async () => {
    trackEvent("go_chat_pdf_download_clicked", { email: submittedEmail });
    try { await downloadPdf(); } catch (e) { console.error(e); }
    toast.success("PDF downloaded.");
  };

  // Step 2b: send the summary email to the user via the transactional queue.
  const handleEmailMe = async () => {
    trackEvent("go_chat_email_me_clicked", {
      email: submittedEmail,
      provider: config?.provider,
    });
    try { await downloadPdf(); } catch (e) { console.error(e); }

    const lastUser = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
    const lastAi = [...messages].reverse().find(m => m.role === "assistant")?.content ?? "";
    const focus = config
      ? `${config.departments.join(", ")} in ${config.industries.join(", ")}`
      : "Your transformation focus";

    try {
      const res = await fetch("/api/public/chat/email-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: submittedEmail,
          focus,
          modelUsed: providerMeta?.name ?? "BizzSurfer Go!",
          question: lastUser,
          excerpt: lastAi.length > 1200 ? lastAi.slice(0, 1200) + "…" : lastAi,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.error) {
        throw new Error(json?.error || `Request failed (${res.status})`);
      }
      if (json?.reason === "email_suppressed") {
        toast.error("This email has unsubscribed and can't receive messages.");
        return;
      }
      toast.success(`Email sent to ${submittedEmail}. PDF downloaded too.`);
    } catch (err) {
      console.error("email send failed", err);
      toast.error("Couldn't send the email. Please try again.");
    }
  };

  const otherProviders = useMemo(() => PROVIDER_META.filter(p => p.id !== config?.provider), [config?.provider]);

  const creditsLeft = Math.max(0, QUESTION_LIMIT - questionCount);

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] max-h-full">
      <div className="px-4 pt-2 pb-1.5 pr-12">
        <div className="rounded-xl text-primary-foreground px-3 py-2 shadow-soft flex items-center gap-2 bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_50%,#f97316_100%)]">
          <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            {providerMeta ? (
              <img src={providerMeta.logo} alt={providerMeta.name} className="w-4 h-4 object-contain" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-[9px] uppercase tracking-wider opacity-90 font-semibold">Agentic AI Advisor</p>
            <p className="text-xs font-bold truncate">
              BizzSurfer Go!{providerMeta ? ` · ${providerMeta.name}` : ""}
            </p>
          </div>
          {config && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur px-2 py-0.5 text-[10px] font-bold shrink-0"
              title={`${creditsLeft} of ${QUESTION_LIMIT} free credits left`}
            >
              <Sparkle className="w-3 h-3" /> {creditsLeft}/{QUESTION_LIMIT}
            </span>
          )}
          {config ? (
            <button
              onClick={resetConfig}
              className="rounded-md bg-white/20 backdrop-blur px-2 py-1 text-[10px] font-bold flex items-center gap-1 shrink-0"
              aria-label="Reconfigure"
            >
              <Settings2 className="w-3 h-3" /> Setup
            </button>
          ) : (
            <a
              href="https://chatgpt.com/g/g-69f61861f0308191bdb780fd6adc5085-bizzsurfer"
              target="_blank" rel="noreferrer"
              className="rounded-md bg-white/20 backdrop-blur px-2 py-1 text-[10px] font-bold flex items-center gap-1 shrink-0"
            >
              GPT <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {!config && <GoChatSetup onComplete={saveConfig} />}

      {config && (
        <>
          {/* Quick model switcher */}
          <div className="px-4 pb-2">
            <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4">
              {PROVIDER_META.map((p) => {
                const isActive = p.id === config.provider;
                return (
                  <button
                    key={p.id}
                    onClick={() => !isActive && switchProvider(p.id)}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 h-8 text-[11px] font-bold transition ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-soft"
                        : "bg-card text-foreground border-border hover:border-primary/40"
                    }`}
                    aria-pressed={isActive}
                    title={`Use ${p.name}`}
                  >
                    <img src={p.logo} alt="" className="w-3.5 h-3.5 object-contain" />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-card ${
                  m.role === "user"
                    ? "bg-gradient-primary text-primary-foreground rounded-br-sm"
                    : "bg-card text-card-foreground border border-border rounded-bl-sm"
                }`}>
                  {m.attachments?.length ? (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {m.attachments.map((a, j) => a.type.startsWith("image/")
                        ? <img key={j} src={a.dataUrl} alt={a.name} className="w-16 h-16 rounded-lg object-cover" />
                        : <span key={j} className="text-[10px] bg-white/30 rounded px-1.5 py-0.5">{a.name}</span>)}
                    </div>
                  ) : null}
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

          {questionCount >= QUESTION_LIMIT && (
            <div className="mx-4 mb-2 rounded-xl bg-accent/60 border border-primary/30 px-3 py-2 text-[11px] text-foreground flex items-center justify-between gap-2">
              <span>You've used your 2 free questions. Get the full report by email.</span>
              <button
                onClick={() => setEmailOpen(true)}
                className="shrink-0 inline-flex items-center gap-1 rounded-full bg-gradient-primary text-primary-foreground px-2.5 py-1 text-[11px] font-bold"
              >
                <Mail className="w-3 h-3" /> Get PDF
              </button>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="px-4 pb-1 flex gap-1.5 flex-wrap">
              {attachments.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px]">
                  {a.type.startsWith("image/")
                    ? <img src={a.dataUrl} alt="" className="w-4 h-4 rounded object-cover" />
                    : <Paperclip className="w-3 h-3" />}
                  {a.name}
                  <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} aria-label="Remove">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="px-4 pt-2 pb-3 bg-background border-t border-border">
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,.txt,.csv,.doc,.docx"
                multiple
                hidden
                onChange={(e) => { onPickFiles(e.target.files); e.target.value = ""; }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={streaming}
                className="rounded-2xl w-11 h-11 bg-muted text-foreground flex items-center justify-center hover:bg-accent transition shrink-0"
                aria-label="Attach file"
                title="Attach image or file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={questionCount >= QUESTION_LIMIT ? "Get the PDF to continue…" : `Ask via ${providerMeta?.name ?? "BizzSurfer Go!"}…`}
                disabled={streaming || questionCount >= QUESTION_LIMIT}
                className="flex-1 rounded-2xl bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
              <Button type="submit" size="icon" disabled={streaming || (!input.trim() && attachments.length === 0)} className="rounded-2xl w-12 h-12 bg-gradient-primary shadow-soft">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </>
      )}

      {/* Email capture popup after 2 questions */}
      <Dialog
        open={emailOpen}
        onOpenChange={(o) => {
          setEmailOpen(o);
          if (!o) { setEmailSubmitted(false); setSubmittedEmail(""); }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              {emailSubmitted ? "You're all set" : "Get your full report"}
            </DialogTitle>
            <DialogDescription>
              {emailSubmitted
                ? "Choose how you'd like to receive your summary."
                : "Confirm your email so we can send a short summary and download your full PDF."}
            </DialogDescription>
          </DialogHeader>

          {!emailSubmitted ? (
            <>
              <div className="space-y-2">
                <label htmlFor="email-confirm" className="text-xs font-bold text-foreground">Confirm your email</label>
                <input
                  id="email-confirm"
                  value={emailValue}
                  onChange={(e) => { setEmailValue(e.target.value); if (emailError) setEmailError(null); }}
                  onBlur={() => setEmailError(validateEmail(emailValue))}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  maxLength={254}
                  placeholder="you@company.com"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : "email-help"}
                  className={`w-full rounded-xl bg-muted border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                    emailError
                      ? "border-destructive ring-destructive/40 focus:ring-destructive/40"
                      : "border-border focus:ring-primary/40"
                  }`}
                  autoFocus
                />
                {emailError ? (
                  <p id="email-error" className="text-[11px] font-semibold text-destructive">{emailError}</p>
                ) : (
                  <p id="email-help" className="text-[11px] text-muted-foreground">
                    The email includes a short version of the PDF, an invite to upcoming events,
                    full reports, and a 1:1 demo call when you upgrade.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={submitEmail}
                  disabled={sending || !!validateEmail(emailValue)}
                  className="rounded-md bg-gradient-primary w-full text-primary-foreground shadow-soft hover:opacity-95 h-12 text-lg font-extrabold px-[20px] border-[#ff6f00] border-2 border-solid"
                >
                  {sending ? "Saving…" : "Confirm email"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-primary/30 bg-accent/60 p-3 text-sm">
                <p className="font-semibold text-foreground">✓ Email confirmed</p>
                <p className="text-[12px] text-muted-foreground mt-0.5 break-all">
                  Saved <span className="font-medium text-foreground">{submittedEmail}</span> to your BizzSurfer list.
                </p>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  className="rounded-xl"
                >
                  <Download className="w-4 h-4 mr-1" /> Download PDF
                </Button>
                <Button
                  onClick={handleEmailMe}
                  className="rounded-md bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95 h-12 text-lg font-extrabold px-[20px] border-[#ff6f00] border-2 border-solid"
                >
                  <Mail className="w-4 h-4 mr-1" /> Email me
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const isBullet = /^\s*[•]\s+/.test(line);
        const clean = line.replace(/^\s*[•]\s+/, "");
        return (
          <p key={i} className={isBullet ? "pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold" : ""}>
            {clean}
          </p>
        );
      })}
    </div>
  );
}
