import type { Category } from "@/lib/marketplace-data";

export type SortKey = "recommended" | "rating" | "price-asc" | "price-desc" | "title";

export type PresetState = {
  category: Category | "all";
  query: string;
  sort: SortKey;
  selectedTags: string[];
  freeOnly: boolean;
  minRating: number;
};

export type Preset = {
  id: string;
  name: string;
  group: "Role" | "Department" | "Transformation" | "Custom";
  state: PresetState;
};

export const defaultState: PresetState = {
  category: "all",
  query: "",
  sort: "recommended",
  selectedTags: [],
  freeOnly: false,
  minRating: 0,
};

// Curated built-in presets. Tag matches are intersected with available tags at runtime.
export const builtInPresets: Preset[] = [
  {
    id: "role-cxo",
    name: "C-suite / Executive",
    group: "Role",
    state: { ...defaultState, sort: "rating", minRating: 4.5, selectedTags: ["strategy", "executive", "leadership"] },
  },
  {
    id: "role-product",
    name: "Product Manager",
    group: "Role",
    state: { ...defaultState, category: "agents", selectedTags: ["product", "research", "roadmap"] },
  },
  {
    id: "role-engineer",
    name: "Engineer / Builder",
    group: "Role",
    state: { ...defaultState, category: "agents", selectedTags: ["developer", "coding", "automation"] },
  },
  {
    id: "dept-marketing",
    name: "Marketing",
    group: "Department",
    state: { ...defaultState, selectedTags: ["marketing", "content", "growth"] },
  },
  {
    id: "dept-sales",
    name: "Sales & Revenue",
    group: "Department",
    state: { ...defaultState, selectedTags: ["sales", "crm", "outreach"] },
  },
  {
    id: "dept-ops",
    name: "Operations",
    group: "Department",
    state: { ...defaultState, selectedTags: ["operations", "automation", "workflow"] },
  },
  {
    id: "dept-hr",
    name: "People & HR",
    group: "Department",
    state: { ...defaultState, selectedTags: ["hr", "people", "hiring"] },
  },
  {
    id: "tx-quickwins",
    name: "Quick wins (free)",
    group: "Transformation",
    state: { ...defaultState, freeOnly: true, sort: "rating" },
  },
  {
    id: "tx-pilots",
    name: "Pilot programs",
    group: "Transformation",
    state: { ...defaultState, category: "services", selectedTags: ["pilot", "workshop", "discovery"] },
  },
  {
    id: "tx-enterprise",
    name: "Enterprise rollout",
    group: "Transformation",
    state: { ...defaultState, category: "services", minRating: 4.5, selectedTags: ["enterprise", "governance", "change"] },
  },
  {
    id: "tx-playbooks",
    name: "Playbooks & templates",
    group: "Transformation",
    state: { ...defaultState, category: "templates", sort: "rating" },
  },
];

const STORAGE_KEY = "bizzsurfer.marketplace.customPresets.v1";
const LAST_KEY = "bizzsurfer.marketplace.lastPresetId.v1";

export function loadCustomPresets(): Preset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Preset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomPresets(presets: Preset[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function loadLastPresetId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_KEY);
}

export function saveLastPresetId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(LAST_KEY, id);
  else localStorage.removeItem(LAST_KEY);
}

export function statesEqual(a: PresetState, b: PresetState): boolean {
  return (
    a.category === b.category &&
    a.query.trim() === b.query.trim() &&
    a.sort === b.sort &&
    a.freeOnly === b.freeOnly &&
    a.minRating === b.minRating &&
    a.selectedTags.length === b.selectedTags.length &&
    [...a.selectedTags].sort().join("|") === [...b.selectedTags].sort().join("|")
  );
}
