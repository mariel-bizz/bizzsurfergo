import { Bot, Briefcase, FileText, type LucideIcon } from "lucide-react";

export type Category = "agents" | "services" | "templates";

export type Listing = {
  id: string;
  category: Category;
  title: string;
  provider: string;
  tagline: string;
  tags: string[];
  price: string;
  rating: number;
  cta: string;
  description: string;
  requirements: string[];
};

export const categoryMeta: Record<Category, { label: string; icon: LucideIcon }> = {
  agents: { label: "Agent", icon: Bot },
  services: { label: "Service", icon: Briefcase },
  templates: { label: "Template", icon: FileText },
};

export const listings: Listing[] = [
  {
    id: "agent-board-brief",
    category: "agents",
    title: "Board Brief Composer",
    provider: "BizzSurfer Labs",
    tagline: "Turns weekly metrics into a one-page board narrative in seconds.",
    tags: ["Reporting", "C-Suite"],
    price: "Included with Hero",
    rating: 4.9,
    cta: "Install Agent",
    description:
      "Board Brief Composer ingests your weekly KPI exports and synthesizes a polished, executive-ready narrative aligned with your strategic themes. It highlights variances, surfaces risks, and proposes talking points so your leadership team walks into every board meeting prepared.",
    requirements: [
      "BizzSurfer Hero plan or higher",
      "Connected data source (Sheets, Snowflake, or BigQuery)",
      "At least one defined KPI workspace",
    ],
  },
  {
    id: "agent-deal-radar",
    category: "agents",
    title: "Deal Radar",
    provider: "Northwind AI",
    tagline: "Monitors pipeline signals and flags deals at risk every morning.",
    tags: ["Sales", "Revenue Ops"],
    price: "€39 / mo",
    rating: 4.7,
    cta: "Install Agent",
    description:
      "Deal Radar continuously analyses CRM activity, email cadence, and engagement signals to score deal health. Each morning your sellers receive a prioritized list of at-risk opportunities with recommended next actions.",
    requirements: [
      "Salesforce, HubSpot, or Pipedrive account",
      "Read access to opportunity and activity objects",
      "Slack or email for daily digests",
    ],
  },
  {
    id: "agent-policy-scout",
    category: "agents",
    title: "Policy Scout",
    provider: "Veritas Cognitive",
    tagline: "Tracks EU AI Act updates and maps them to your compliance posture.",
    tags: ["Compliance", "Risk"],
    price: "€59 / mo",
    rating: 4.8,
    cta: "Install Agent",
    description:
      "Policy Scout monitors regulatory feeds across the EU AI Act, GDPR, and ISO/IEC 42001. It maps each change to your registered AI use cases and produces a remediation checklist tailored to your risk tier.",
    requirements: [
      "Registered AI use-case inventory",
      "Designated compliance owner",
      "Single sign-on enabled",
    ],
  },
  {
    id: "svc-transformation-sprint",
    category: "services",
    title: "AI Transformation Sprint",
    provider: "Helix Advisory",
    tagline: "6-week diagnostic + roadmap with executive workshops and KPIs.",
    tags: ["Strategy", "Roadmap"],
    price: "From €18,000",
    rating: 4.9,
    cta: "Request Intro",
    description:
      "A 6-week engagement combining executive workshops, capability assessments, and a prioritized 12-month roadmap. Deliverables include a value-tree model, target operating model, and a board-ready business case.",
    requirements: [
      "Executive sponsor at C-level",
      "Access to 6–10 stakeholders for interviews",
      "Latest strategy and finance plan",
    ],
  },
  {
    id: "svc-agentops",
    category: "services",
    title: "AgentOps Implementation",
    provider: "Mosaic Partners",
    tagline: "Stand up production-grade agent infrastructure on your stack.",
    tags: ["Engineering", "MLOps"],
    price: "Custom",
    rating: 4.8,
    cta: "Request Intro",
    description:
      "Mosaic engineers deploy a hardened agent runtime — observability, evaluation harness, guardrails, and CI/CD — onto your cloud. Includes 12 weeks of pairing with your platform team and a knowledge transfer plan.",
    requirements: [
      "AWS, GCP, or Azure account",
      "Existing CI/CD pipeline",
      "Two engineers available for pairing",
    ],
  },
  {
    id: "svc-governance",
    category: "services",
    title: "AI Governance Audit",
    provider: "Beacon & Co.",
    tagline: "Independent audit of model risk, data lineage, and policy gaps.",
    tags: ["Governance", "Audit"],
    price: "From €9,500",
    rating: 4.7,
    cta: "Request Intro",
    description:
      "An independent audit benchmarking your AI governance against NIST AI RMF and ISO/IEC 42001. The deliverable is a gap analysis, remediation roadmap, and a board-ready attestation letter.",
    requirements: [
      "Inventory of deployed AI systems",
      "Access to model and data documentation",
      "2–3 hours from policy and security leads",
    ],
  },
  {
    id: "tpl-roi-model",
    category: "templates",
    title: "Executive ROI Model",
    provider: "BizzSurfer Studio",
    tagline: "Editable financial model for AI initiatives with sensitivity analysis.",
    tags: ["Finance", "ROI"],
    price: "Free",
    rating: 4.9,
    cta: "Download",
    description:
      "A polished spreadsheet model for sizing AI investments. Includes adoption curves, productivity uplift, and a Monte Carlo sensitivity tab so you can stress-test assumptions in front of your CFO.",
    requirements: [
      "Microsoft Excel 2019+ or Google Sheets",
      "Baseline cost and headcount inputs",
    ],
  },
  {
    id: "tpl-prompt-pack",
    category: "templates",
    title: "C-Suite Prompt Pack",
    provider: "Prompt Atelier",
    tagline: "120 battle-tested prompts for strategy, finance, and operations.",
    tags: ["Prompts", "Productivity"],
    price: "€29",
    rating: 4.8,
    cta: "Download",
    description:
      "A curated library of 120 prompts spanning strategy memos, financial analysis, board prep, and stakeholder communications. Each prompt ships with guidance on context, tone, and the recommended model tier.",
    requirements: [
      "Access to a frontier LLM (GPT-5, Gemini 2.5, or Claude)",
      "Notion, Obsidian, or Markdown reader",
    ],
  },
  {
    id: "tpl-playbook",
    category: "templates",
    title: "Agentic Transformation Playbook",
    provider: "BizzSurfer Studio",
    tagline: "90-day playbook with rituals, scorecards, and stakeholder maps.",
    tags: ["Playbook", "Change"],
    price: "€49",
    rating: 4.9,
    cta: "Download",
    description:
      "A 90-day operating playbook to mobilize your agentic AI program. Includes weekly rituals, a stakeholder RACI, executive scorecards, and change-management collateral.",
    requirements: [
      "Named program lead",
      "Executive steering committee",
      "Notion or Confluence for distribution",
    ],
  },
];

export function getListing(id: string): Listing | undefined {
  return listings.find((l) => l.id === id);
}

/**
 * Parse a freeform listing price string into a chargeable amount in cents
 * and an interval. Returns null when the listing isn't directly payable
 * (free, included, or "Custom" / "From €X" quotes that need an intro).
 */
export function parseListingPrice(price: string): {
  amountInCents: number;
  currency: "eur";
  interval: "month" | null;
  display: string;
} | null {
  const lower = price.toLowerCase().trim();
  if (!lower || lower.includes("free") || lower.includes("included") || lower.includes("custom")) {
    return null;
  }
  // "From €18,000" → quote-only, not a fixed price the user can self-checkout.
  if (lower.startsWith("from")) return null;
  const match = price.match(/(\d[\d,.]*)/);
  if (!match) return null;
  const amount = parseFloat(match[1].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const interval = /\bmo\b|month/.test(lower) ? "month" : null;
  return {
    amountInCents: Math.round(amount * 100),
    currency: "eur",
    interval,
    display: price,
  };
}

