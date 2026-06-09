import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  Linkedin,
  Send,
  CheckCircle2,
  Youtube,
  Music2,
  Globe,
  MessageCircle,
  Twitter,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — BizzSurfer GO!" },
      {
        name: "description",
        content:
          "Get in touch with the BizzSurfer GO! team for partnerships, support, or executive inquiries about Agentic AI for business transformation.",
      },
      { property: "og:title", content: "Contact Us — BizzSurfer GO!" },
      {
        property: "og:description",
        content:
          "Reach the BizzSurfer GO! team — partnerships, support, and executive inquiries.",
      },
      { property: "og:url", content: "https://go.bizzsurfer.ai/contact" },
    ],
    links: [{ rel: "canonical", href: "https://go.bizzsurfer.ai/contact" }],
  }),
  component: ContactPage,
});

const TOPICS = [
  "Partnership",
  "Enterprise pilot",
  "Demo request",
  "Press / media",
  "Investor inquiry",
  "Support",
  "Other",
];

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  role: z.string().trim().min(1, "Role is required").max(120),
  company: z.string().trim().min(1, "Company is required").max(150),
  email: z.string().trim().email("Invalid email").max(254),
  phone: z
    .string()
    .trim()
    .min(5, "Phone is required")
    .max(30)
    .regex(
      /^\+[1-9]\d{1,3}[\s\-().\d]{4,}$/,
      "Use international prefix, e.g. +1 555 123 4567",
    ),
  topic: z.string().trim().min(1, "Please pick a topic"),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(4000),
});

type FormState = z.infer<typeof contactSchema>;

const EMPTY: FormState = {
  name: "",
  role: "",
  company: "",
  email: "",
  phone: "",
  topic: "",
  message: "",
};

const FIELD_CLASS =
  "border-[#ff8a1f]/40 focus-visible:border-[#ff8a1f] focus-visible:ring-[#ff8a1f]/30";


const SOCIALS: { label: string; href: string; Icon: typeof Linkedin; bg: string }[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/bizzsurfer", Icon: Linkedin, bg: "bg-[#0A66C2]" },
  { label: "YouTube", href: "https://www.youtube.com/@bizzsurfer", Icon: Youtube, bg: "bg-[#FF0000]" },
  { label: "Spotify", href: "https://open.spotify.com/show/bizzsurfer", Icon: Music2, bg: "bg-[#1DB954]" },
  { label: "Website", href: "https://www.bizzsurfer.com", Icon: Globe, bg: "bg-gradient-to-br from-orange-400 to-pink-500" },
  { label: "WhatsApp", href: "https://wa.me/0", Icon: MessageCircle, bg: "bg-[#25D366]" },
  { label: "Twitter", href: "https://twitter.com/bizzsurfer", Icon: Twitter, bg: "bg-[#1DA1F2]" },
];

function ContactPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const next: Partial<Record<keyof FormState, string>> = {};
      result.error.issues.forEach((i) => {
        const key = i.path[0] as keyof FormState;
        if (!next[key]) next[key] = i.message;
      });
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, website: honeypot }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to send message");
      }
      setForm(EMPTY);
      setHoneypot("");
      setSubmitted(true);
      toast.success("Message sent — we'll be in touch within one business day.");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again or email hello@bizzsurfer.com.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-5 py-10">
        <Link to="/" className="text-sm text-primary underline">
          ← Back home
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Contact us</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We'd love to hear from you. Reach out for partnerships, demos, support, or
          anything Agentic AI.
        </p>

        <div className="mt-8 grid gap-4 grid-cols-1">
          <a
            href="mailto:hello@bizzsurfer.com"
            title="Email"
            aria-label="Email hello@bizzsurfer.com"
            className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors min-w-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-105"
                style={{ background: "linear-gradient(135deg, #d94f04 0%, #ff8a1f 100%)" }}
              >
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground break-all">
                  hello@bizzsurfer.com
                </div>
              </div>
              <GoBadge />
            </div>
          </a>

          <a
            href="https://www.linkedin.com/company/bizzsurfer"
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn"
            aria-label="LinkedIn @bizzsurfer"
            className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors min-w-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-105"
                style={{ background: "linear-gradient(135deg, #d94f04 0%, #ff8a1f 100%)" }}
              >
                <Linkedin className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground truncate">@bizzsurfer</div>
              </div>
              <GoBadge />
            </div>
          </a>
        </div>

        <section
          className="mt-8 rounded-2xl border-2 border-[#ff8a1f]/40 bg-card p-6"
          style={{ boxShadow: "0 0 0 1px rgba(255,138,31,0.15), 0 10px 40px -10px rgba(255,138,31,0.35), 0 0 60px -20px rgba(217,79,4,0.25)" }}
        >
          <h2 className="text-lg font-semibold text-foreground">Send us a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All fields are required. We'll get back within one business day.
          </p>

          {submitted ? (
            <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Thanks — your message is on its way.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Our team has been notified and will reply to {form.email || "you"} shortly.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSubmitted(false)}
                  >
                    Send another message
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-5 grid gap-4" noValidate>
              {/* Honeypot — visually hidden, ignored by users, filled by bots */}
              <div aria-hidden className="absolute left-[-9999px] top-auto w-px h-px overflow-hidden">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="grid gap-4 grid-cols-1">
                <Field id="name" label="Name" error={errors.name}>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Jane Doe"
                    aria-invalid={!!errors.name}
                    className={FIELD_CLASS}
                  />
                </Field>
                <Field id="role" label="Role" error={errors.role}>
                  <Input
                    id="role"
                    value={form.role}
                    onChange={(e) => update("role", e.target.value)}
                    placeholder="COO, Founder…"
                    aria-invalid={!!errors.role}
                    className={FIELD_CLASS}
                  />
                </Field>
              </div>

              <div className="grid gap-4 grid-cols-1">
                <Field id="company" label="Company" error={errors.company}>
                  <Input
                    id="company"
                    value={form.company}
                    onChange={(e) => update("company", e.target.value)}
                    placeholder="Acme Inc."
                    aria-invalid={!!errors.company}
                    className={FIELD_CLASS}
                  />
                </Field>
                <Field id="email" label="Email" error={errors.email}>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="jane@company.com"
                    aria-invalid={!!errors.email}
                    className={FIELD_CLASS}
                  />
                </Field>
              </div>

              <div className="grid gap-4 grid-cols-1">
                <Field
                  id="phone"
                  label="Phone (with international prefix)"
                  error={errors.phone}
                >
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="+1 555 123 4567"
                    aria-invalid={!!errors.phone}
                    className={FIELD_CLASS}
                  />
                </Field>
                <Field id="topic" label="Preferred topic" error={errors.topic}>
                  <Select value={form.topic} onValueChange={(v) => update("topic", v)}>
                    <SelectTrigger id="topic" aria-invalid={!!errors.topic} className={FIELD_CLASS}>
                      <SelectValue placeholder="Pick a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOPICS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field id="message" label="Message" error={errors.message}>
                <Textarea
                  id="message"
                  rows={5}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="Tell us a bit about what you're looking for…"
                  aria-invalid={!!errors.message}
                    className={FIELD_CLASS}
                />
              </Field>

              <Button type="submit" disabled={submitting} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </section>

        {/* Follow section rendered globally at end of every page via AppShell */}

      </div>
    </main>
  );
}

function GoBadge() {
  return (
    <span
      className="ml-auto shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-white shadow-sm transition-all duration-200 group-hover:translate-x-0.5 group-hover:shadow-md group-hover:scale-[1.03] group-active:scale-95"
      style={{ background: "linear-gradient(90deg, #3b5bdb 0%, #d94f04 55%, #ff8a1f 100%)" }}
    >
      GO <span aria-hidden>➜</span>
    </span>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
