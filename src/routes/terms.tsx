import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — BizzSurfer Go!" },
      {
        name: "description",
        content:
          "Terms of service governing your use of BizzSurfer Go!, the executive Agentic AI platform for business transformation.",
      },
      { property: "og:title", content: "Terms of Service — BizzSurfer Go!" },
    ],
    links: [{ rel: "canonical", href: "https://go.bizzsurfer.ai/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-5 py-10">
        <Link to="/" className="text-sm text-primary underline">
          ← Back home
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: May 14, 2026</p>

        <section className="prose prose-sm dark:prose-invert mt-6 max-w-none">
          <h2>1. Acceptance of terms</h2>
          <p>
            By accessing or using BizzSurfer Go! (the "Service"), you agree to be bound by these Terms of
            Service ("Terms"). If you do not agree, do not use the Service.
          </p>

          <h2>2. Description of service</h2>
          <p>
            BizzSurfer Go! provides AI-assisted advisory content, executive insights, events, and
            related tools focused on Agentic AI for business transformation. Content is for
            informational purposes and does not constitute legal, financial, or professional advice.
          </p>

          <h2>3. Accounts and waitlist</h2>
          <p>
            You may join our waitlist or create an account by providing accurate information.
            You are responsible for safeguarding your credentials and for all activity under your
            account.
          </p>

          <h2>4. Acceptable use</h2>
          <p>
            You agree not to misuse the Service, including but not limited to: reverse engineering,
            scraping at scale, transmitting unlawful content, attempting to bypass security or rate
            limits, or using the Service to build a competing product.
          </p>

          <h2>5. Payments and subscriptions</h2>
          <p>
            Paid plans are billed via Stripe. Subscriptions auto-renew until canceled. Refunds are
            handled on a case-by-case basis under applicable consumer law.
          </p>

          <h2>6. Intellectual property</h2>
          <p>
            All content, branding, and software in the Service are owned by BizzSurfer or its
            licensors. You receive a limited, non-exclusive, non-transferable license to use the
            Service for its intended purpose.
          </p>

          <h2>7. AI output disclaimer</h2>
          <p>
            AI-generated responses may contain inaccuracies. You are responsible for evaluating any
            output before relying on it for business decisions.
          </p>

          <h2>8. Privacy</h2>
          <p>
            Your use of the Service is also governed by our{" "}
            <a
              href="https://bizzsurfer.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Privacy Policy
            </a>
            .
          </p>

          <h2>9. Termination</h2>
          <p>
            We may suspend or terminate access to the Service at any time for breach of these Terms
            or for operational reasons.
          </p>

          <h2>10. Disclaimers and liability</h2>
          <p>
            The Service is provided "as is" without warranties of any kind. To the fullest extent
            permitted by law, BizzSurfer is not liable for indirect, incidental, or consequential
            damages arising from your use of the Service.
          </p>

          <h2>11. Changes</h2>
          <p>
            We may update these Terms from time to time. Material changes will be communicated
            through the Service or by email.
          </p>

          <h2>12. Contact</h2>
          <p>
            Questions? Reach us at{" "}
            <a href="mailto:hello@bizzsurfer.com" className="text-primary underline">
              hello@bizzsurfer.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
