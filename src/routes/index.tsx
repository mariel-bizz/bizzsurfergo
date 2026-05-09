import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        name: "description",
        content:
          "BizzSurfer Go! brings Agentic AI to enterprise transformation leaders—connect your business systems and orchestrate change with AI agents, ROI tools, and expert resources.",
      },
    ],
    links: [{ rel: "canonical", href: "https://bizzsurfergo.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://bizzsurfergo.lovable.app/#organization",
              name: "BizzSurfer",
              url: "https://bizzsurfergo.lovable.app/",
              logo: "https://bizzsurfergo.lovable.app/favicon.png",
              description:
                "BizzSurfer delivers Agentic AI Intelligence for Business Transformation leaders.",
            },
            {
              "@type": "SoftwareApplication",
              "@id": "https://bizzsurfergo.lovable.app/#app",
              name: "BizzSurfer Go!",
              url: "https://bizzsurfergo.lovable.app/",
              image: "https://bizzsurfergo.lovable.app/og-image.png",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "Agentic AI Intelligence for Business Transformation. Connect enterprise systems and let AI agents orchestrate transformation.",
              publisher: { "@id": "https://bizzsurfergo.lovable.app/#organization" },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            },
            {
              "@type": "FAQPage",
              "@id": "https://bizzsurfergo.lovable.app/#faq",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What's the difference between Agentic AI and AI agents?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "AI agents are task-specific, rule-based, human-directed. Agentic AI is autonomous, adaptive, and outcome-driven — it perceives, decides and acts across systems with minimal human steering.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How fast can we deploy BizzSurfer in our enterprise?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "First Agentic AI workflows go live in 2–4 weeks once core systems are connected. Full transformation orchestration typically scales over a 90-day execution sprint.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is it secure for regulated industries?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. BizzSurfer runs with role-based access, full audit trails, and supports private deployments. Designed with CISO-grade governance from day one.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Will it replace our transformation team?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "No. It amplifies them. BizzSurfer is human-centred technology — leaders stay in the driver's seat, agents handle the orchestration load.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What ROI should leaders expect?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Customers report 30–60% reduction in execution time, 2–3x faster decision cycles, and measurable adoption lift across change initiatives within the first quarter.",
                  },
                },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <AppShell />;
}
