import { createFileRoute } from "@tanstack/react-router";
import { HomeTab } from "@/components/tabs/HomeTab";

const SITE = "https://go.bizzsurfer.ai";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BizzSurfer Go! — Agentic AI for Business Transformation" },
      {
        name: "description",
        content:
          "Agentic AI for enterprise transformation leaders—connect business systems, orchestrate change, and accelerate ROI with AI agents.",
      },
      { property: "og:title", content: "BizzSurfer Go! — Agentic AI for Business Transformation" },
      {
        property: "og:description",
        content:
          "Connect enterprise systems and let AI agents orchestrate change. Built for transformation leaders who want measurable ROI.",
      },
      { property: "og:url", content: "https://go.bizzsurfer.ai/" },
      { name: "twitter:title", content: "BizzSurfer Go! — Agentic AI for Business Transformation" },
      {
        name: "twitter:description",
        content:
          "Connect enterprise systems and let AI agents orchestrate change. Built for transformation leaders who want measurable ROI.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": `${SITE}/#website`,
              name: "BizzSurfer Go!",
              url: `${SITE}/`,
              publisher: { "@id": `${SITE}/#organization` },
              inLanguage: "en-US",
            },
            {
              "@type": "Organization",
              "@id": `${SITE}/#organization`,
              name: "BizzSurfer",
              url: `${SITE}/`,
              logo: `${SITE}/favicon.png`,
              description:
                "BizzSurfer delivers Agentic AI Intelligence for Business Transformation leaders.",
            },
            {
              "@type": "SoftwareApplication",
              "@id": `${SITE}/#app`,
              name: "BizzSurfer Go!",
              url: `${SITE}/`,
              image: `${SITE}/og-image.png`,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "Agentic AI Intelligence for Business Transformation. Connect enterprise systems and let AI agents orchestrate transformation.",
              publisher: { "@id": `${SITE}/#organization` },
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            },
            {
              "@type": "FAQPage",
              "@id": `${SITE}/#faq`,
              mainEntity: [
                { "@type": "Question", name: "What's the difference between Agentic AI and AI agents?", acceptedAnswer: { "@type": "Answer", text: "AI agents are narrow assistants that wait for prompts and execute a single task. Agentic AI is the orchestration layer above them: it sets goals, sequences multiple agents and tools, monitors outcomes, and adapts in real time across enterprise systems like ERP, CRM, HRIS, and BI." } },
                { "@type": "Question", name: "How fast can we deploy BizzSurfer Agentic AI in our enterprise?", acceptedAnswer: { "@type": "Answer", text: "Most transformation teams ship their first orchestrated workflow in 2–6 weeks. A typical 90-day plan moves from connected systems to first autonomous workflow to measurable ROI, deployed incrementally rather than as a multi-quarter programme." } },
                { "@type": "Question", name: "Is BizzSurfer secure and compliant for regulated industries?", acceptedAnswer: { "@type": "Answer", text: "Yes. BizzSurfer ships with role-based access control, audit logging, SSO/SAML, encryption in transit and at rest, and private/VPC deployments. It aligns with SOC 2, GDPR, HIPAA, and ISO 27001 controls for finance, healthcare, insurance, and the public sector." } },
                { "@type": "Question", name: "Will Agentic AI replace our transformation team?", acceptedAnswer: { "@type": "Answer", text: "No — it amplifies them. Humans set strategy and own outcomes while agents handle coordination, status-chasing, data wrangling, and execution. Teams typically reclaim 30–50% of their time for higher-leverage strategic work." } },
                { "@type": "Question", name: "What ROI should executives expect from Agentic AI?", acceptedAnswer: { "@type": "Answer", text: "Customers commonly report 3–6 month payback: 40–70% faster decision cycles, 25–40% reduction in change-management overhead, and double-digit lift in adoption of transformation initiatives." } },
                { "@type": "Question", name: "Which enterprise systems does BizzSurfer connect to?", acceptedAnswer: { "@type": "Answer", text: "BizzSurfer integrates with SAP, Oracle, Microsoft Dynamics, Salesforce, Workday, SuccessFactors, ServiceNow, Snowflake, Databricks, Jira, Confluence, Slack, Microsoft 365, and Google Workspace, plus REST, GraphQL, and webhook APIs for custom systems." } },
                { "@type": "Question", name: "How is Agentic AI different from RPA or traditional automation?", acceptedAnswer: { "@type": "Answer", text: "RPA follows hard-coded rules and breaks when a process changes. Agentic AI reasons about goals, handles ambiguity, calls tools and APIs dynamically, and learns from feedback — orchestrating outcomes rather than automating a fixed task." } },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: HomeTab,
});
