import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MapPin, Linkedin, Send } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  company: z.string().trim().max(150).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(2000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        fieldErrors[i.path[0] as string] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const subject = encodeURIComponent(`Contact from ${form.name}${form.company ? ` (${form.company})` : ""}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company || "-"}\n\n${form.message}`,
    );
    window.location.href = `mailto:hello@bizzsurfer.com?subject=${subject}&body=${body}`;
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Opening your email app to send the message…");
    }, 400);
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

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href="mailto:hello@bizzsurfer.com"
            className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Email</div>
                <div className="text-sm font-semibold text-foreground truncate">hello@bizzsurfer.com</div>
              </div>
            </div>
          </a>

          <a
            href="https://www.linkedin.com/company/bizzsurfer"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Linkedin className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">LinkedIn</div>
                <div className="text-sm font-semibold text-foreground truncate">@bizzsurfer</div>
              </div>
            </div>
          </a>

          <div className="rounded-2xl border border-border bg-card p-5 sm:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Headquarters</div>
                <div className="text-sm font-semibold text-foreground">Europe — operating globally</div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Send us a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll get back within one business day.
          </p>

          <form onSubmit={onSubmit} className="mt-5 grid gap-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Doe"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@company.com"
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company">Company (optional)</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Acme Inc."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us a bit about what you're looking for…"
                aria-invalid={!!errors.message}
              />
              {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
            </div>

            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Sending…" : "Send message"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
