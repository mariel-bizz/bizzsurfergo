import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MapPin, Linkedin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — BizzSurfer Go!" },
      {
        name: "description",
        content:
          "Get in touch with the BizzSurfer Go! team for partnerships, support, or executive inquiries about Agentic AI for business transformation.",
      },
      { property: "og:title", content: "Contact Us — BizzSurfer Go!" },
      {
        property: "og:description",
        content:
          "Reach the BizzSurfer Go! team — partnerships, support, and executive inquiries.",
      },
      { property: "og:url", content: "https://go.bizzsurfer.ai/contact" },
    ],
    links: [{ rel: "canonical", href: "https://go.bizzsurfer.ai/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
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
            className="rounded-2xl border border-border bg-card p-5 shadow-elegant hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Email</div>
                <div className="text-sm font-semibold text-foreground">hello@bizzsurfer.com</div>
              </div>
            </div>
          </a>

          <a
            href="https://www.linkedin.com/company/bizzsurfer"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-border bg-card p-5 shadow-elegant hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">LinkedIn</div>
                <div className="text-sm font-semibold text-foreground">@bizzsurfer</div>
              </div>
            </div>
          </a>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant sm:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Headquarters</div>
                <div className="text-sm font-semibold text-foreground">Europe — operating globally</div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Talk to our team</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            For executive briefings, enterprise pilots, or media inquiries, email us at{" "}
            <a href="mailto:hello@bizzsurfer.com" className="text-primary underline">
              hello@bizzsurfer.com
            </a>{" "}
            and we'll get back within one business day.
          </p>
        </section>
      </div>
    </main>
  );
}
