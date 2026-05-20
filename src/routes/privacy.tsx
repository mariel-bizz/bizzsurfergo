import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — BizzSurfer Go!" },
      {
        name: "description",
        content:
          "How BizzSurfer collects, uses, and protects personal data under GDPR and Dutch privacy law.",
      },
      { property: "og:title", content: "Privacy Policy — BizzSurfer Go!" },
      {
        property: "og:description",
        content:
          "How BizzSurfer collects, uses, and protects personal data under GDPR and Dutch privacy law.",
      },
    ],
    links: [{ rel: "canonical", href: "https://go.bizzsurfer.ai/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-5 py-10">
        <Link to="/" className="text-sm text-primary underline">
          ← Back home
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: April 2026</p>

        <section className="prose prose-sm dark:prose-invert mt-6 max-w-none">
          <p>
            This Privacy Policy explains how BizzSurfer (&ldquo;we&rdquo;, &ldquo;us&rdquo;)
            collects, uses, and protects personal data when you visit{" "}
            <a
              href="https://bizzsurfer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              bizzsurfer.com
            </a>
            , use BizzSurfer Go!, request a demo, or otherwise interact with us. We operate under
            the General Data Protection Regulation (GDPR) and Dutch privacy law.
          </p>

          <h2>1. Data Controller</h2>
          <p>
            The data controller is <strong>Coach4expats, The Netherlands<br />hello@bizzsurfer.com</strong>.
          </p>
          <p>
            For privacy questions, contact us at{" "}
            <a href="mailto:hello@bizzsurfer.com" className="text-primary underline">
              hello@bizzsurfer.com
            </a>
            .
          </p>

          <h2>2. What we collect</h2>
          <h3>Information you give us</h3>
          <ul>
            <li>Name, work email, company, and the message you submit through our contact / demo form.</li>
            <li>Any additional information you choose to share when you email us or book a meeting.</li>
            <li>Account information (email, profile details) when you sign up for BizzSurfer Go!.</li>
          </ul>
          <h3>Information collected automatically</h3>
          <ul>
            <li>
              Standard server and analytics data: IP address (truncated where possible), device
              and browser type, referring page, pages viewed, and timestamps.
            </li>
            <li>Cookies and similar technologies — see section 7.</li>
          </ul>

          <h2>3. Why we use your data</h2>
          <ul>
            <li>To reply to your demo requests and messages.</li>
            <li>To operate, secure, and improve the website and BizzSurfer Go!.</li>
            <li>To measure aggregate traffic and performance.</li>
            <li>To comply with legal obligations.</li>
          </ul>
          <p>
            We do not sell your personal data, and we do not use it for automated decision-making
            that produces legal effects on you.
          </p>

          <h2>4. Legal basis under GDPR</h2>
          <ul>
            <li>
              <strong>Art. 6(1)(a) — Consent</strong>: for non-essential analytics and marketing
              cookies, and for newsletter subscriptions (you can withdraw this at any time).
            </li>
            <li>
              <strong>Art. 6(1)(b) — Contract / pre-contractual steps</strong>: when you request a
              demo, create an account, or purchase a subscription and we handle your request.
            </li>
            <li>
              <strong>Art. 6(1)(f) — Legitimate interest</strong>: to secure the site, prevent
              abuse, and understand aggregate usage.
            </li>
            <li>
              <strong>Art. 6(1)(c) — Legal obligation</strong>: when we must retain records (e.g.
              tax, accounting).
            </li>
          </ul>

          <h2>5. How long we keep it</h2>
          <ul>
            <li>Demo and contact requests: up to 24 months after last contact, then deleted or anonymised.</li>
            <li>Email correspondence: up to 36 months, unless a longer retention is legally required.</li>
            <li>Account data: for as long as your account is active, then deleted within 12 months of closure.</li>
            <li>Website analytics: up to 14 months in aggregated form.</li>
            <li>Server logs: typically 30 days.</li>
          </ul>

          <h2>6. Third-party services</h2>
          <p>We rely on a small number of carefully selected processors to run the site and product:</p>
          <ul>
            <li>
              <strong>Vercel &amp; Cloudflare</strong> — hosting, edge delivery, and privacy-friendly
              traffic metrics.
            </li>
            <li>
              <strong>Supabase</strong> — database, authentication, and file storage for BizzSurfer Go!.
            </li>
            <li>
              <strong>Stripe</strong> — payment processing for subscriptions and marketplace transactions.
            </li>
            <li>
              <strong>Brevo</strong> — newsletter delivery and transactional email.
            </li>
            <li>
              <strong>Google Tag Manager &amp; Google Analytics</strong> — measurement tags, only
              activated after you give consent.
            </li>
            <li>
              <strong>Resend</strong> — delivers emails sent through our contact and transactional flows.
            </li>
            <li>
              <strong>Contentful</strong> — content management for our blog / insights section.
            </li>
            <li>
              <strong>Microsoft 365 (Outlook Bookings)</strong> — used when you book a demo meeting.
            </li>
          </ul>
          <p>Each processor handles data under a data processing agreement and in line with this policy.</p>

          <h2>7. Cookies</h2>
          <p>We use two categories of cookies and similar technologies:</p>
          <ul>
            <li>
              <strong>Essential</strong>: required for the site to work and be secure (e.g.
              authentication sessions, routing). These do not need consent.
            </li>
            <li>
              <strong>Analytics &amp; marketing</strong>: loaded via Google Tag Manager (including
              Google Analytics) to help us understand how the site is used. These are only set
              after you accept them in our cookie banner. You can change your choice at any time
              by clearing cookies or using the banner's &ldquo;Reject&rdquo; option on your next visit.
            </li>
          </ul>

          <h2>8. Your rights under GDPR</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request erasure (&ldquo;right to be forgotten&rdquo;).</li>
            <li>Request restriction of processing.</li>
            <li>Data portability — receive your data in a structured, commonly used format.</li>
            <li>Object to processing based on legitimate interest.</li>
            <li>Withdraw consent at any time where processing is based on consent.</li>
          </ul>
          <p>
            To exercise any of these rights, email{" "}
            <a href="mailto:hello@bizzsurfer.com" className="text-primary underline">
              hello@bizzsurfer.com
            </a>
            . We respond within 30 days.
          </p>
          <p>
            You also have the right to lodge a complaint with the Dutch Data Protection Authority,{" "}
            <a
              href="https://autoriteitpersoonsgegevens.nl/en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Autoriteit Persoonsgegevens
            </a>
            .
          </p>

          <h2>9. International transfers</h2>
          <p>
            Some of our processors (notably Vercel, Cloudflare, Stripe, and Google) are based in
            the United States. When personal data is transferred outside the European Economic
            Area, we rely on the European Commission's adequacy decision for the EU-U.S. Data
            Privacy Framework and/or Standard Contractual Clauses (SCCs), together with the
            technical and organisational safeguards each provider offers.
          </p>

          <h2>10. Security</h2>
          <p>
            We use HTTPS everywhere, encrypt data at rest, limit access to personal data on a
            need-to-know basis, and review our security practices regularly. No online service can
            be 100% secure, but we take reasonable steps to protect your information.
          </p>

          <h2>11. Changes to this policy</h2>
          <p>
            We may update this policy to reflect changes in our services or the law. The
            &ldquo;Last updated&rdquo; date at the top shows the latest version. Significant
            changes will be highlighted on this page.
          </p>

          <h2>12. Contact</h2>
          <p>
            Coach4expats, The Netherlands
            <br />
            <a href="mailto:hello@bizzsurfer.com" className="text-primary underline">
              hello@bizzsurfer.com
            </a>
          </p>

          <p className="mt-8">
            See also our{" "}
            <Link to="/terms" className="text-primary underline">
              Terms of Service
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
