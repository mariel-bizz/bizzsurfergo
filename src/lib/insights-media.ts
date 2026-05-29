export type DownloadResource = {
  id: string;
  title: string;
  description: string;
  file: string; // public path
  category: string;
};

export type VideoItem = {
  id: string;
  title: string;
  description: string;
  src: string; // public path
  poster?: string; // public path
  featured?: boolean;
};

export const SITE_ORIGIN = "https://go.bizzsurfer.ai";

export const downloadResources: DownloadResource[] = [
  {
    id: "linkedinlive-agentic-vs-agents",
    title: "LinkedIn Live: Agentic AI vs. AI Agents",
    description: "Slide deck from our LinkedIn Live unpacking the difference between Agentic AI and traditional AI agents.",
    file: "/resources/bizzsurfer-linkedinlive-agentic-ai-vs-ai-agents.pdf",
    category: "Webinar",
  },
  {
    id: "ai-act-carousel",
    title: "BizzSurfer AI Act Carousel",
    description: "A concise carousel summarising what the EU AI Act means for transformation leaders.",
    file: "/resources/bizzsurfer-ai-act-carousel.pdf",
    category: "Carousel",
  },
  {
    id: "eu-ai-act-carousel",
    title: "EU AI Act — Deep Dive Carousel",
    description: "Detailed breakdown of the EU AI Act obligations, timelines and risk categories.",
    file: "/resources/bizzsurfer-eu-ai-act-carousel.pdf",
    category: "Carousel",
  },
  {
    id: "bulk-carousel-d1",
    title: "BizzSurfer Insights Carousel",
    description: "Curated carousel from our content series with frameworks and quick wins.",
    file: "/resources/bizzsurfer-bulk-carousel.pdf",
    category: "Carousel",
  },
];

export const videos: VideoItem[] = [
  {
    id: "product-launch",
    title: "BizzSurfer GO! launch 🚀",
    description:
      "Meet BizzSurfer GO! and join the new technology era with Agentic AI orchestration for Business Transformation! ⚡",
    src: "/videos/product-launch.mp4",
    poster: "/videos/posters/product-launch.jpg",
    featured: true,
  },
  {
    id: "eu-pay-transparency",
    title: "Agentic AI builds an EU Pay Transparency plan",
    description: "We asked Agentic AI to build a plan for EU Pay Transparency — here's what it produced.",
    src: "/videos/agentic-ai-eu-pay-transparency.mp4",
    poster: "/videos/posters/eu-pay-transparency.jpg",
  },
];

export const featuredVideo = videos.find((v) => v.featured) ?? videos[0];
