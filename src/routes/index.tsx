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
              "@type": "BreadcrumbList",
              "@id": "https://bizzsurfergo.lovable.app/#breadcrumbs",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "BizzSurfer",
                  item: "https://bizzsurfergo.lovable.app/",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "BizzSurfer Go!",
                  item: "https://bizzsurfergo.lovable.app/",
                },
              ],
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
                    text: "AI agents handle specific tasks under human direction. Agentic AI is designed to act more autonomously, coordinating decisions and actions across connected systems.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How fast can we deploy BizzSurfer in our enterprise?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Timelines depend on which systems are connected and the scope of the rollout. Workflows can be introduced incrementally rather than as a single large programme.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is it secure for regulated industries?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "BizzSurfer is built with role-based access, audit logging, and support for private deployments, so it can fit within governed enterprise environments.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Will it replace our transformation team?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "No. BizzSurfer is built to support transformation teams — people stay in control of decisions while agents help with coordination and execution work.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What ROI should leaders expect?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Outcomes vary by organisation and use case. The platform is designed to shorten execution cycles, speed up decisions, and improve adoption of change initiatives.",
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
