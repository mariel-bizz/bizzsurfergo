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
