import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "../AppShell";
import { Button } from "@/components/ui/button";
import {
  Send,
  Sparkles,
  ExternalLink,
  Settings2,
  Paperclip,
  X,
  Mail,
  Download,
  Zap,
  Sparkle,
  Plus,
  Mic,
  StopCircle,
  Image as ImageIcon,
  FolderOpen,
  Save,
  Share2,
  FileText,
  Loader2,
}  from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useServerFn } from "@tanstack/react-start";
import { generateChatImage } from "@/lib/chat-image.functions";
import { transcribeChatAudio } from "@/lib/chat-audio.functions";
import { toast } from "sonner";
import {
  GoChatSetup,
  PROVIDER_META,
  type GoChatConfig,
  type Provider,
} from "@/components/chat/GoChatSetup";
import jsPDF from "jspdf";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  } catch {
    return null;
  }
}

type Attachment = {
  name: string;
  type: string;
  dataUrl: string;
  progress?: number; // 0-100 while uploading; undefined when done
  transcript?: string; // for audio attachments
};
type Msg = { role: "user" | "assistant"; content: string; attachments?: Attachment[] };

const CONFIG_KEY = "bizzsurfer.gochat.config";
const AUTOSAVE_KEY = "bizzsurfer.chat.autosave";
const AUTOSAVE_VERSIONS_KEY = "bizzsurfer.chat.autosave.versions";
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
    .replace(/^#{1,6}\s+/gm, "") // drop markdown headings (we use paragraphs)
    .replace(/^\s*[•]\s+/gm, "- "); // normalise stray bullets to markdown lists
}

function buildInitialAssistant(cfg: GoChatConfig | null): string {
  return cfg
    ? `I'm **BizzSurfer Go!** — focused on **${cfg.departments.join(", ")}** in **${cfg.industries.join(", ")}**.\n\nAsk me anything, or pick a starter below.`
    : "I'm **BizzSurfer Go!** — your Agentic AI advisor for business transformation.\n\nAsk me anything, or pick a question below to get started.";
}

export function ChatTab({ seedPrompt }: { seedPrompt?: string } = {}) {
  const game = useGame();
  const [config, setConfig] = useState<GoChatConfig | null>(null);
  const gemPersona =
    config?.provider === "gemini"
      ? "You are the BizzSurfer Gem — a Gemini-powered Agentic AI transformation advisor for senior leaders. Mirror the tone and structure of a Google Gemini Gem: concise, structured, with crisp headings and bullets. Never tell the user to open Gemini, sign in to Google, or leave this app — you are the Gem, running here."
      : "";
  const contextPreamble = config
    ? `${gemPersona ? gemPersona + "\n\n" : ""}Context: the leader is exploring an Agentic AI transformation in ${config.departments.join(", ")} for the ${config.industries.join(", ")} industry. Tailor every answer to that scope. Reply in short paragraphs separated by blank lines. Use markdown **bold** to highlight the key terms, metrics and frameworks. Use simple "-" bullets for short lists. Never use markdown headings.`
    : "";
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window === "undefined") {
      return [{ role: "assistant", content: buildInitialAssistant(null) }];
    }
    try {
      const raw = window.localStorage.getItem(AUTOSAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Msg[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [{ role: "assistant", content: buildInitialAssistant(null) }];
  });
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
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [industryError, setIndustryError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [plusOpen, setPlusOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recorderMimeRef = useRef<string>("audio/webm");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ dataUrl: string; prompt: string } | null>(null);
  const [projectsDialogOpen, setProjectsDialogOpen] = useState(false);
  const [savedProjects, setSavedProjects] = useState<
    Array<{ id: string; name: string; messages: Msg[]; savedAt: string }>
  >([]);
  const generateImageFn = useServerFn(generateChatImage);
  const transcribeAudioFn = useServerFn(transcribeChatAudio);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CONFIG_KEY);
      const saved = raw ? (JSON.parse(raw) as GoChatConfig) : null;
      if (!saved) return;
      setConfig(saved);
      setMessages((prev) =>
        prev.length === 1 &&
        prev[0]?.role === "assistant" &&
        prev[0]?.content === buildInitialAssistant(null)
          ? [{ role: "assistant", content: buildInitialAssistant(saved) }]
          : prev,
      );
    } catch {
      /* ignore */
    }
  }, []);

  // Load any prior session email to pre-fill the popup.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmailValue(data.user.email);
    });
  }, []);

  useEffect(() => {
    if (seedPrompt) setInput(seedPrompt);
  }, [seedPrompt]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  // Auto-save current chat to localStorage + keep up to 10 historical versions.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (messages.length === 0) return;
    try {
      window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(messages));
      // Throttle version snapshots to one per ~30s of edits.
      const versionsRaw = window.localStorage.getItem(AUTOSAVE_VERSIONS_KEY);
      const versions = versionsRaw
        ? (JSON.parse(versionsRaw) as Array<{ at: string; messages: Msg[] }>)
        : [];
      const last = versions[0];
      const now = Date.now();
      if (!last || now - new Date(last.at).getTime() > 30_000) {
        const next = [{ at: new Date().toISOString(), messages }, ...versions].slice(0, 10);
        window.localStorage.setItem(AUTOSAVE_VERSIONS_KEY, JSON.stringify(next));
      }
    } catch {
      /* quota or serialization issue — ignore */
    }
  }, [messages]);

  const saveConfig = (cfg: GoChatConfig) => {
    try {
      window.localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
    } catch {
      /* ignore */
    }
    setConfig(cfg);
    setMessages([
      {
        role: "assistant",
        content: `Locked in: ${PROVIDER_META.find((p) => p.id === cfg.provider)?.name} for ${cfg.departments.join(", ")} in ${cfg.industries.join(", ")}. What's the first question on your board agenda?`,
      },
    ]);
    setQuestionCount(0);
  };

  const switchProvider = (provider: Provider) => {
    if (!config) return;
    const next = { ...config, provider };
    try {
      window.localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setConfig(next);
    toast.success(`Switched to ${PROVIDER_META.find((p) => p.id === provider)?.name}`);
  };

  const resetConfig = () => {
    try {
      window.localStorage.removeItem(CONFIG_KEY);
    } catch {
      /* ignore */
    }
    setConfig(null);
    setMessages([{ role: "assistant", content: "Let's reconfigure your BizzSurfer GO! chat." }]);
    setQuestionCount(0);
  };

  const PROJECTS_KEY = "bizzsurfer.chat.projects";
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROJECTS_KEY);
      if (raw) setSavedProjects(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const saveProjectsList = (
    list: Array<{ id: string; name: string; messages: Msg[]; savedAt: string }>,
  ) => {
    setSavedProjects(list);
    try {
      window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  };

  const saveCurrentAsProject = () => {
    const name = window.prompt("Name this project");
    if (!name?.trim()) return;
    const entry = {
      id: crypto.randomUUID(),
      name: name.trim(),
      messages,
      savedAt: new Date().toISOString(),
    };
    saveProjectsList([entry, ...savedProjects].slice(0, 20));
    toast.success(`Saved project "${entry.name}"`);
  };

  const loadProject = (id: string) => {
    const p = savedProjects.find((x) => x.id === id);
    if (!p) return;
    setMessages(p.messages);
    setProjectsDialogOpen(false);
    toast.success(`Loaded "${p.name}"`);
  };

  const deleteProject = (id: string) => {
    saveProjectsList(savedProjects.filter((p) => p.id !== id));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime =
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "audio/webm";
      recorderMimeRef.current = mime;
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recordedChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordedChunksRef.current, { type: mime });
        if (blob.size === 0) {
          toast.error("Empty recording");
          return;
        }
        if (blob.size > 10 * 1024 * 1024) {
          toast.error("Recording over 10MB");
          return;
        }
        const dataUrl: string = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(blob);
        });
        const ext = mime.includes("mp4") ? "m4a" : "webm";
        const name = `recording-${Date.now()}.${ext}`;
        // Insert as attachment with "transcribing" progress.
        setAttachments((prev) =>
          [...prev, { name, type: mime, dataUrl, progress: 0 }].slice(0, 4),
        );
        setTranscribing(true);
        try {
          const { transcript } = await transcribeAudioFn({
            data: { audioBase64: dataUrl, mimeType: mime },
          });
          setAttachments((prev) =>
            prev.map((a) =>
              a.name === name ? { ...a, progress: undefined, transcript } : a,
            ),
          );
          // Pre-fill the input with the transcript so the user can edit + send.
          setInput((cur) => (cur.trim() ? `${cur}\n\n${transcript}` : transcript));
          toast.success("Transcription ready");
        } catch (err) {
          setAttachments((prev) =>
            prev.map((a) => (a.name === name ? { ...a, progress: undefined } : a)),
          );
          toast.error(err instanceof Error ? err.message : "Transcription failed");
        } finally {
          setTranscribing(false);
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    try {
      recorderRef.current?.stop();
    } catch {
      /* ignore */
    }
    recorderRef.current = null;
    setRecording(false);
  };

  const runImageGen = async () => {
    if (!imagePrompt.trim() || generatingImage) return;
    setGeneratingImage(true);
    try {
      const { dataUrl } = await generateImageFn({ data: { prompt: imagePrompt.trim() } });
      setImagePreview({ dataUrl, prompt: imagePrompt.trim() });
      setImageDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image generation failed");
    } finally {
      setGeneratingImage(false);
    }
  };

  const insertImageAsMessage = () => {
    if (!imagePreview) return;
    const att: Attachment = {
      name: `image-${Date.now()}.png`,
      type: "image/png",
      dataUrl: imagePreview.dataUrl,
    };
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `🎨 Generated image — *${imagePreview.prompt}*`,
        attachments: [att],
      },
    ]);
    setImagePreview(null);
    setImagePrompt("");
    toast.success("Image added to chat");
  };

  const attachImageFromPreview = () => {
    if (!imagePreview) return;
    setAttachments((prev) =>
      [
        ...prev,
        {
          name: `image-${Date.now()}.png`,
          type: "image/png",
          dataUrl: imagePreview.dataUrl,
        },
      ].slice(0, 4),
    );
    setImagePreview(null);
    setImagePrompt("");
    toast.success("Attached to next message");
  };

  const shareAttachment = async (a: Attachment) => {
    try {
      const blob = await (await fetch(a.dataUrl)).blob();
      const file = new File([blob], a.name, { type: a.type });
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: a.name });
      } else {
        // Fallback: copy data URL
        await navigator.clipboard.writeText(a.dataUrl);
        toast.success("Image link copied");
      }
    } catch (e) {
      if ((e as DOMException)?.name !== "AbortError") {
        toast.error("Couldn't share");
      }
    }
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files) return;
    const slots = Math.max(0, 4 - attachments.length);
    const list = Array.from(files).slice(0, slots);
    for (const f of list) {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} is over 10MB`);
        continue;
      }
      // Insert placeholder chip with 0% progress immediately.
      setAttachments((prev) =>
        [...prev, { name: f.name, type: f.type, dataUrl: "", progress: 0 }].slice(0, 4),
      );
      await new Promise<void>((resolve, reject) => {
        const r = new FileReader();
        r.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.min(99, Math.round((ev.loaded / ev.total) * 100));
            setAttachments((prev) =>
              prev.map((a) => (a.name === f.name && a.progress !== undefined ? { ...a, progress: pct } : a)),
            );
          }
        };
        r.onload = () => {
          const dataUrl = r.result as string;
          setAttachments((prev) =>
            prev.map((a) =>
              a.name === f.name && a.progress !== undefined
                ? { ...a, dataUrl, progress: undefined }
                : a,
            ),
          );
          resolve();
        };
        r.onerror = () => {
          setAttachments((prev) => prev.filter((a) => !(a.name === f.name && a.progress !== undefined)));
          toast.error(`Couldn't read ${f.name}`);
          reject(r.error);
        };
        r.readAsDataURL(f);
      }).catch(() => {});
    }
  };

  const send = async (text: string) => {
    if ((!text.trim() && attachments.length === 0) || streaming) return;
    if (questionCount >= QUESTION_LIMIT) {
      setEmailOpen(true);
      return;
    }

    const userMsg: Msg = {
      role: "user",
      content: text,
      attachments: attachments.length ? attachments : undefined,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setAttachments([]);
    setStreaming(true);
    // Decrement credits immediately so the header updates in real time.
    const newCount = questionCount + 1;
    setQuestionCount(newCount);
    if (newCount >= QUESTION_LIMIT) setTimeout(() => setEmailOpen(true), 800);

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
        return prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, content: cleanAnswer(acc) } : m,
        );
      });
    };

    try {
      // Build payload: attachments are inlined as a brief text reference (vision multi-modal isn't wired in the edge fn).
      const apiMessages = next.map((m) => ({
        role: m.role,
        content: m.attachments?.length
          ? `${m.content}\n\n[Attached files: ${m.attachments.map((a) => a.name).join(", ")}]`
          : m.content,
      }));

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: contextPreamble
            ? [{ role: "system", content: contextPreamble }, ...apiMessages]
            : apiMessages,
          provider: config?.provider ?? null,
          language:
            typeof window !== "undefined"
              ? window.localStorage.getItem("bizzsurfer.lang") || "en"
              : "en",
        }),
      });

      if (resp.status === 429) {
        toast.error("Rate limit reached. Try again shortly.");
        setStreaming(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted. Add credits to continue.");
        setStreaming(false);
        return;
      }
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
          if (json === "[DONE]") {
            done = true;
            break;
          }
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

  // ---- PDF + email summary ----
  const buildSummaryText = () => {
    const lines: string[] = [];
    lines.push("BizzSurfer Go! — Conversation summary");
    if (config) {
      lines.push(`Model: ${PROVIDER_META.find((p) => p.id === config.provider)?.name}`);
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
      try {
        doc.addImage(logo, "PNG", margin, 22, 46, 46);
      } catch {
        /* ignore */
      }
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
    doc.text("Your conversation report", margin, y);
    y += 10;
    doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.setLineWidth(2);
    doc.line(margin, y, margin + 48, y);
    y += 24;

    // Meta block
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(new Date().toLocaleString(), margin, y);
    y += 14;
    if (config) {
      doc.text(`Model: ${PROVIDER_META.find((p) => p.id === config.provider)?.name}`, margin, y);
      y += 14;
      doc.text(`Departments: ${config.departments.join(", ")}`, margin, y);
      y += 14;
      doc.text(`Industries: ${config.industries.join(", ")}`, margin, y);
      y += 22;
    }

    // Conversation
    doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
    doc.setFontSize(11);

    messages.slice(1).forEach((m) => {
      if (y > pageH - 40) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      doc.setFontSize(10);
      doc.text(m.role === "user" ? "YOU" : "BIZZSURFER GO!", margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
      doc.setFontSize(11);
      const body = doc.splitTextToSize(m.content, width);
      body.forEach((l: string) => {
        if (y > pageH) {
          doc.addPage();
          y = margin;
        }
        doc.text(l, margin, y);
        y += 15;
      });
      y += 10;
    });

    // CTA card
    if (y > pageH - 110) {
      doc.addPage();
      y = margin;
    }
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
    doc.text(
      "Upgrade to BizzSurfer Pro for unlimited questions, full reports,",
      margin + 14,
      y + 40,
    );
    doc.text("upcoming events and a 1:1 demo call with our team.", margin + 14, y + 54);
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.setFont("helvetica", "bold");
    doc.textWithLink("→ Book a demo call", margin + 14, y + 76, {
      url: "https://go.bizzsurfer.ai/pricing",
    });

    doc.save("bizzsurfer-go-summary.pdf");
    trackEvent("go_chat_pdf_downloaded", {
      email: submittedEmail || undefined,
      provider: config?.provider,
      messages: messages.length - 1,
    });
  };

  // Step 1: validate + persist email to waitlist, then show inline confirmation.
  // Send the short-report summary email via the transactional queue.
  const sendSummaryEmail = async (recipientEmail: string) => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const lastAi = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";
    const focus = config
      ? `${config.departments.join(", ")} in ${config.industries.join(", ")}`
      : "Your transformation focus";

    const res = await fetch("/api/public/chat/email-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientEmail,
        focus,
        modelUsed: providerMeta?.name ?? "BizzSurfer Go!",
        question: lastUser,
        excerpt: lastAi.length > 1200 ? lastAi.slice(0, 1200) + "…" : lastAi,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.error) throw new Error(json?.error || `Request failed (${res.status})`);
    return json as { reason?: string };
  };

  // Validate every lead field; show inline errors and submit only when all pass.
  const submitEmail = async () => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    const co = company.trim();
    const industry = config?.industries.join(", ") ?? "";
    const fnErr = !fn ? "First name is required." : fn.length > 80 ? "Too long." : null;
    const lnErr = !ln ? "Last name is required." : ln.length > 80 ? "Too long." : null;
    const coErr = !co ? "Company is required." : co.length > 120 ? "Too long." : null;
    const indErr = !industry ? "Industry is required — complete chat setup." : null;
    const emErr = validateEmail(emailValue);
    setFirstNameError(fnErr);
    setLastNameError(lnErr);
    setCompanyError(coErr);
    setIndustryError(indErr);
    setEmailError(emErr);
    if (fnErr || lnErr || coErr || indErr || emErr) return;

    setSending(true);
    const cleanEmail = emailValue.trim().toLowerCase();

    try {
      const fullName = `${fn} ${ln}`.trim();
      const { error } = await supabase.from("waitlist").insert({
        email: cleanEmail,
        name: fullName,
        role: `go_chat · ${co} · ${config?.provider ?? ""} · ${industry}`,
      });
      if (error && error.code !== "23505") console.warn("waitlist insert:", error.message);
    } catch (e) {
      /* non-blocking */
    }

    trackEvent("go_chat_email_submitted", {
      email: cleanEmail,
      provider: config?.provider,
      company: co,
    });

    // Auto-deliver the short PDF report by email.
    try {
      const json = await sendSummaryEmail(cleanEmail);
      if (json?.reason === "email_suppressed") {
        toast.error("This email has unsubscribed and can't receive messages.");
      } else {
        toast.success(`Short report on its way to ${cleanEmail}.`);
      }
    } catch (err) {
      console.error("email send failed", err);
      toast.error("Couldn't email the report. You can still download it.");
    }

    setSubmittedEmail(cleanEmail);
    setEmailSubmitted(true);
    setSending(false);
  };

  // Step 2a: trigger the in-browser PDF download.
  const handleDownloadPdf = async () => {
    trackEvent("go_chat_pdf_download_clicked", { email: submittedEmail });
    try {
      await downloadPdf();
    } catch (e) {
      console.error(e);
    }
    toast.success("PDF downloaded.");
  };

  // Step 2b: Upgrade CTA — unlocks the full report by sending the user to the pricing flow.
  const handleUpgrade = () => {
    trackEvent("go_chat_upgrade_clicked", { email: submittedEmail, provider: config?.provider });
    setEmailOpen(false);
    if (typeof window !== "undefined") window.location.assign("/pricing");
  };

  const otherProviders = useMemo(
    () => PROVIDER_META.filter((p) => p.id !== config?.provider),
    [config?.provider],
  );

  const creditsLeft = Math.max(0, QUESTION_LIMIT - questionCount);

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] max-h-full">
      <div className="px-4 pt-2 pb-1.5 pr-12">
        <div className="rounded-xl text-primary-foreground px-3 py-2 shadow-soft flex items-center gap-2 bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_50%,#f97316_100%)]">
          <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            {providerMeta ? (
              <img
                src={providerMeta.logo}
                alt={providerMeta.name}
                className="w-4 h-4 object-contain"
              />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-[9px] uppercase tracking-wider opacity-90 font-semibold">
              Agentic AI Advisor
            </p>
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
              target="_blank"
              rel="noreferrer"
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
            <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-card ${
                    m.role === "user"
                      ? "bg-gradient-primary text-primary-foreground rounded-br-sm"
                      : "bg-card text-card-foreground border border-border rounded-bl-sm"
                  }`}
                >
                  {m.attachments?.length ? (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {m.attachments.map((a, j) =>
                        a.type.startsWith("image/") ? (
                          <img
                            key={j}
                            src={a.dataUrl}
                            alt={a.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <span key={j} className="text-[10px] bg-white/30 rounded px-1.5 py-0.5">
                            {a.name}
                          </span>
                        ),
                      )}
                    </div>
                  ) : null}
                  <FormattedText text={m.content} isUser={m.role === "user"} />
                </div>
              </div>
            ))}
            {streaming && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
                Try a leader question
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="snap-start shrink-0 max-w-[80%] text-left rounded-xl bg-accent text-accent-foreground px-3 py-2 text-xs font-medium border border-primary/20 hover:bg-accent/80 transition"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {questionCount >= QUESTION_LIMIT && (
            <div className="mx-4 mb-2 rounded-xl bg-accent/60 border border-primary/30 px-3 py-2 text-[11px] text-foreground flex items-center justify-between gap-2">
              <span>
                You've used all {QUESTION_LIMIT} free credits. Unlock the full report by email.
              </span>
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
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px]"
                >
                  {a.type.startsWith("image/") ? (
                    <img src={a.dataUrl} alt="" className="w-4 h-4 rounded object-cover" />
                  ) : (
                    <Paperclip className="w-3 h-3" />
                  )}
                  {a.name}
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                    aria-label="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="px-4 pt-2 pb-3 bg-background border-t border-border"
          >
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,audio/*,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.md,.json"
                multiple
                hidden
                onChange={(e) => {
                  onPickFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <Popover open={plusOpen} onOpenChange={setPlusOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={streaming}
                    className="rounded-2xl w-11 h-11 bg-muted text-foreground flex items-center justify-center hover:bg-accent transition shrink-0"
                    aria-label="Add"
                    title="Add photos, files, audio, or create"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" side="top" className="w-64 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPlusOpen(false);
                      fileRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-accent text-left"
                  >
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    Add photos &amp; files
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlusOpen(false);
                      if (recording) stopRecording();
                      else startRecording();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-accent text-left"
                  >
                    {recording ? (
                      <StopCircle className="w-4 h-4 text-destructive" />
                    ) : (
                      <Mic className="w-4 h-4 text-muted-foreground" />
                    )}
                    {recording ? "Stop recording" : "Record audio"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlusOpen(false);
                      setImageDialogOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-accent text-left"
                  >
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    Create image
                  </button>
                  <div className="my-1 h-px bg-border" />
                  <button
                    type="button"
                    onClick={() => {
                      setPlusOpen(false);
                      saveCurrentAsProject();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-accent text-left"
                  >
                    <Save className="w-4 h-4 text-muted-foreground" />
                    Save as project
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlusOpen(false);
                      setProjectsDialogOpen(true);
                    }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-accent text-left"
                  >
                    <span className="flex items-center gap-3">
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                      My projects
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {savedProjects.length}
                    </span>
                  </button>
                </PopoverContent>
              </Popover>
              {recording && (
                <span className="inline-flex items-center gap-1 text-[11px] text-destructive font-medium">
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  REC
                </span>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  questionCount >= QUESTION_LIMIT
                    ? "Get the PDF to continue…"
                    : `Ask via ${providerMeta?.name ?? "BizzSurfer Go!"}…`
                }
                disabled={streaming || questionCount >= QUESTION_LIMIT}
                className="flex-1 rounded-2xl bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
              <Button
                type="submit"
                size="icon"
                disabled={streaming || (!input.trim() && attachments.length === 0)}
                className="rounded-2xl w-12 h-12 bg-gradient-primary shadow-soft"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </>
      )}

      {/* Create image dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create an image</DialogTitle>
            <DialogDescription>
              Describe the image you want. It will be attached to your next message.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="e.g. A boardroom diagram showing agentic AI handoffs"
            className="w-full min-h-[100px] rounded-lg border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={runImageGen}
              disabled={!imagePrompt.trim() || generatingImage}
              className="bg-gradient-primary"
            >
              {generatingImage ? "Generating…" : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Projects dialog */}
      <Dialog open={projectsDialogOpen} onOpenChange={setProjectsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>My projects</DialogTitle>
            <DialogDescription>
              Saved conversations stored on this device.
            </DialogDescription>
          </DialogHeader>
          {savedProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No saved projects yet. Use “Save as project” from the + menu.
            </p>
          ) : (
            <ul className="space-y-1 max-h-72 overflow-y-auto">
              {savedProjects.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <button
                    onClick={() => loadProject(p.id)}
                    className="flex-1 text-left"
                  >
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(p.savedAt).toLocaleString()} · {p.messages.length} msgs
                    </div>
                  </button>
                  <button
                    onClick={() => deleteProject(p.id)}
                    aria-label="Delete"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {/* Email capture popup after 2 questions */}
      <Dialog
        open={emailOpen}
        onOpenChange={(o) => {
          setEmailOpen(o);
          if (!o) {
            setEmailSubmitted(false);
            setSubmittedEmail("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              {emailSubmitted ? "Your free report is on its way" : "Get your executive report"}
            </DialogTitle>
            <DialogDescription>
              {emailSubmitted
                ? "Download the short PDF now or upgrade for the full report."
                : "Tell us where to send it. The free plan ships a short executive report — upgrade for the full version."}
            </DialogDescription>
          </DialogHeader>

          {!emailSubmitted ? (
            <>
              <div className="rounded-lg bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-orange-500/10 border border-primary/20 px-3 py-2 text-[11px] font-semibold text-foreground flex items-center gap-2">
                <Sparkle className="w-3.5 h-3.5 text-primary" />
                <span>
                  Free plan: short executive report. <span className="text-primary">Upgrade</span>{" "}
                  for the full report + benefits.
                </span>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (firstNameError) setFirstNameError(null);
                      }}
                      onBlur={() =>
                        setFirstNameError(firstName.trim() ? null : "First name is required.")
                      }
                      placeholder="First name"
                      autoComplete="given-name"
                      maxLength={80}
                      aria-invalid={!!firstNameError}
                      className={`w-full rounded-xl bg-muted border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${firstNameError ? "border-destructive ring-destructive/40 focus:ring-destructive/40" : "border-border focus:ring-primary/40"}`}
                    />
                    {firstNameError && (
                      <p className="mt-1 text-[11px] font-semibold text-destructive">
                        {firstNameError}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (lastNameError) setLastNameError(null);
                      }}
                      onBlur={() =>
                        setLastNameError(lastName.trim() ? null : "Last name is required.")
                      }
                      placeholder="Last name (Surname)"
                      autoComplete="family-name"
                      maxLength={80}
                      aria-invalid={!!lastNameError}
                      className={`w-full rounded-xl bg-muted border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${lastNameError ? "border-destructive ring-destructive/40 focus:ring-destructive/40" : "border-border focus:ring-primary/40"}`}
                    />
                    {lastNameError && (
                      <p className="mt-1 text-[11px] font-semibold text-destructive">
                        {lastNameError}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <input
                    value={company}
                    onChange={(e) => {
                      setCompany(e.target.value);
                      if (companyError) setCompanyError(null);
                    }}
                    onBlur={() => setCompanyError(company.trim() ? null : "Company is required.")}
                    placeholder="Company"
                    autoComplete="organization"
                    maxLength={120}
                    aria-invalid={!!companyError}
                    className={`w-full rounded-xl bg-muted border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${companyError ? "border-destructive ring-destructive/40 focus:ring-destructive/40" : "border-border focus:ring-primary/40"}`}
                  />
                  {companyError && (
                    <p className="mt-1 text-[11px] font-semibold text-destructive">
                      {companyError}
                    </p>
                  )}
                </div>
                {config ? (
                  <div className="text-[11px] text-muted-foreground px-1">
                    Industry:{" "}
                    <span className="font-semibold text-foreground">
                      {config.industries.join(", ")}
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] font-semibold text-destructive px-1">
                    Industry missing — open chat setup to pick an industry before sending.
                  </p>
                )}
                {industryError && (
                  <p className="text-[11px] font-semibold text-destructive px-1">{industryError}</p>
                )}
                <div>
                  <input
                    id="email-confirm"
                    value={emailValue}
                    onChange={(e) => {
                      setEmailValue(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    onBlur={() => setEmailError(validateEmail(emailValue))}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    maxLength={254}
                    placeholder="you@company.com"
                    aria-invalid={!!emailError}
                    className={`w-full rounded-xl bg-muted border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                      emailError
                        ? "border-destructive ring-destructive/40 focus:ring-destructive/40"
                        : "border-border focus:ring-primary/40"
                    }`}
                  />
                  {emailError && (
                    <p className="mt-1 text-[11px] font-semibold text-destructive">{emailError}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={submitEmail}
                  disabled={sending}
                  className="rounded-md bg-gradient-primary w-full text-primary-foreground shadow-soft hover:opacity-95 h-12 text-base font-extrabold border-[#ff6f00] border-2 border-solid"
                >
                  {sending ? "Sending…" : "Email me my free report"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-primary/30 bg-accent/60 p-3 text-sm space-y-1.5">
                <p className="font-semibold text-foreground">✓ Free short report ready</p>
                <p className="text-[12px] text-muted-foreground break-all">
                  Sent to <span className="font-medium text-foreground">{submittedEmail}</span>.
                </p>
                <p className="text-[12px] text-foreground pt-1">
                  💎 <span className="font-bold">Upgrade</span> to unlock the{" "}
                  <span className="font-bold">full report</span>, unlimited credits, events &amp; a
                  1:1 demo.
                </p>
              </div>
              <DialogFooter className="gap-2 flex-col sm:flex-row">
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  className="rounded-md h-12 text-base font-bold border-2 flex-1"
                >
                  <Download className="w-4 h-4 mr-1" /> Short PDF
                </Button>
                <Button
                  onClick={handleUpgrade}
                  className="rounded-md bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95 h-12 text-base font-extrabold border-[#ff6f00] border-2 border-solid flex-1"
                >
                  <Zap className="w-4 h-4 mr-1" /> Upgrade
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormattedText({ text, isUser = false }: { text: string; isUser?: boolean }) {
  return (
    <div
      className={`prose prose-sm max-w-none break-words ${
        isUser
          ? "prose-invert prose-p:my-1.5 prose-strong:text-primary-foreground prose-strong:font-extrabold"
          : "prose-p:my-1.5 prose-p:text-card-foreground prose-strong:text-primary prose-strong:font-extrabold prose-ul:my-1.5 prose-li:my-0.5 prose-a:text-primary"
      }`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
