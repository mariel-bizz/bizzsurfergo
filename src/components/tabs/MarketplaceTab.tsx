import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Briefcase,
  FileText,
  Sparkles,
  Star,
  Search,
  ArrowUpDown,
  X,
  Bookmark,
  BookmarkPlus,
  RotateCcw,
  Trash2,
  Wand2,
  ShoppingCart,
  Plus,
  Check as CheckIcon,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { listings, categoryMeta, type Category } from "@/lib/marketplace-data";
import { addToCart, useCart } from "@/lib/marketplace-cart";
import { MarketplaceCartSheet } from "@/components/marketplace/MarketplaceCartSheet";
import {
  MarketplaceOnboarding,
  hasCompletedMarketplaceOnboarding,
} from "@/components/marketplace/MarketplaceOnboarding";
import { ListYourOfferingDialog } from "@/components/marketplace/ListYourOfferingDialog";
import {
  builtInPresets,
  defaultState,
  loadCustomPresets,
  loadLastPresetId,
  saveCustomPresets,
  saveLastPresetId,
  statesEqual,
  type Preset,
  type PresetState,
} from "@/lib/marketplace-presets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const categories: { key: Category | "all"; label: string; icon: typeof Bot }[] = [
  { key: "all", label: "All", icon: Sparkles },
  { key: "agents", label: "Agents", icon: Bot },
  { key: "services", label: "Services", icon: Briefcase },
  { key: "templates", label: "Templates", icon: FileText },
];

type SortKey = PresetState["sort"];

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Top rated" },
  { value: "title", label: "Name (A–Z)" },
];

const presetGroups: Preset["group"][] = ["Role", "Department", "Transformation", "Custom"];

export function MarketplaceTab() {
  const [active, setActive] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const { listings: cartListings } = useCart();

  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listOfferingOpen, setListOfferingOpen] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => l.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, []);

  function applyState(s: PresetState) {
    setActive(s.category);
    setQuery(s.query);
    setSort(s.sort);
    setSelectedTags(s.selectedTags);
    setFreeOnly(s.freeOnly);
    setMinRating(s.minRating);
  }

  // Load saved presets and apply last-used preset on mount.
  useEffect(() => {
    const saved = loadCustomPresets();
    setCustomPresets(saved);
    const lastId = loadLastPresetId();
    if (lastId) {
      const found = [...builtInPresets, ...saved].find((p) => p.id === lastId);
      if (found) {
        applyState(found.state);
        setActivePresetId(found.id);
        return;
      }
    }
    if (!hasCompletedMarketplaceOnboarding()) {
      setOnboardingOpen(true);
    }
  }, []);

  const currentState: PresetState = {
    category: active,
    query,
    sort,
    selectedTags,
    freeOnly,
    minRating,
  };

  function applyPreset(p: Preset) {
    // Drop tags not present in the catalog so a preset still partially applies.
    const validTags = new Set(allTags);
    const filteredTags = p.state.selectedTags.filter((t) => validTags.has(t));
    applyState({ ...p.state, selectedTags: filteredTags });
    setActivePresetId(p.id);
    saveLastPresetId(p.id);
  }

  function resetFilters() {
    applyState(defaultState);
    setActivePresetId(null);
    saveLastPresetId(null);
  }

  function handleOnboardingApply(
    state: PresetState,
    bestPresetId: string | null,
    label: string,
  ) {
    applyState(state);
    setActivePresetId(bestPresetId);
    saveLastPresetId(bestPresetId);
    toast.success(`Tailored marketplace for ${label}`);
  }

  function handleSavePreset() {
    const name = presetName.trim();
    if (!name) return;
    const id = `custom-${Date.now()}`;
    const next: Preset = { id, name, group: "Custom", state: currentState };
    const updated = [...customPresets, next];
    setCustomPresets(updated);
    saveCustomPresets(updated);
    setActivePresetId(id);
    saveLastPresetId(id);
    setPresetName("");
    setSaveOpen(false);
    toast.success(`Saved preset “${name}”`);
  }

  function deletePreset(id: string) {
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    saveCustomPresets(updated);
    if (activePresetId === id) {
      setActivePresetId(null);
      saveLastPresetId(null);
    }
  }

  const allPresets = useMemo(
    () => [...builtInPresets, ...customPresets],
    [customPresets],
  );
  const activePreset = useMemo(
    () => allPresets.find((p) => p.id === activePresetId) ?? null,
    [allPresets, activePresetId],
  );
  const presetModified = activePreset
    ? !statesEqual(activePreset.state, currentState)
    : false;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = listings.filter((l) => {
      if (active !== "all" && l.category !== active) return false;
      if (
        q &&
        !l.title.toLowerCase().includes(q) &&
        !l.provider.toLowerCase().includes(q) &&
        !l.tags.some((t) => t.toLowerCase().includes(q))
      )
        return false;
      if (selectedTags.length && !selectedTags.every((t) => l.tags.includes(t)))
        return false;
      if (l.rating < minRating) return false;
      return true;
    });

    const sorted = [...result];
    switch (sort) {
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }
    return sorted;
  }, [active, query, selectedTags, minRating, sort]);

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  const activeFilterCount =
    selectedTags.length + (freeOnly ? 1 : 0) + (minRating > 0 ? 1 : 0);

  const clearFilters = () => {
    setSelectedTags([]);
    setFreeOnly(false);
    setMinRating(0);
  };

  return (
    <div className="px-5 py-5 space-y-5">
      <header className="relative text-center">
        <button
          onClick={() => setCartOpen(true)}
          className="absolute right-0 top-0 inline-flex items-center gap-1.5 rounded-full bg-card border border-border h-10 px-3 text-xs font-bold text-foreground hover:border-primary/40 shadow-soft"
          aria-label={`Open cart (${cartListings.length} item${cartListings.length === 1 ? "" : "s"})`}
        >
          <ShoppingCart className="w-4 h-4 text-primary" />
          Cart
          {cartListings.length > 0 && (
            <span className="ml-0.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {cartListings.length}
            </span>
          )}
        </button>
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-elegant">
          <Bot className="w-10 h-10 text-primary-foreground" strokeWidth={2.25} />
        </div>
        <span className="mt-4 inline-block rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
          Agentic AI
        </span>
        <h1 className="mt-3 text-2xl font-bold text-foreground">
          Curated agents, services & playbooks
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hand-picked tools to accelerate your Agentic AI transformation.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search marketplace..."
          className="w-full h-11 rounded-2xl bg-card border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label="Search marketplace"
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-card border border-border h-9 px-3 text-xs font-bold text-foreground hover:border-primary/40"
          aria-expanded={filtersOpen}
          aria-controls="marketplace-filters"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          {filtersOpen ? "Hide filters" : "Show filters"}
          {activeFilterCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {filtersOpen && (
      <>
      {/* Preset switcher */}
      <section
        aria-label="Filter presets"
        className="rounded-3xl bg-card border border-border p-4 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Bookmark className="w-4 h-4 text-primary shrink-0" />
            <h2 className="text-sm font-bold text-foreground truncate">
              Filter presets
            </h2>
            {activePreset && (
              <span className="text-[11px] font-semibold text-muted-foreground truncate">
                · {activePreset.name}
                {presetModified ? " (modified)" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setOnboardingOpen(true)}
              className="inline-flex items-center gap-1 rounded-full h-8 px-3 text-[11px] font-bold bg-accent text-accent-foreground"
              title="Personalize via a quick 3-step wizard"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Personalize
            </button>
            <button
              onClick={() => setSaveOpen(true)}
              className="inline-flex items-center gap-1 rounded-full h-8 px-3 text-[11px] font-bold bg-gradient-primary text-primary-foreground shadow-soft"
              title="Save current filters as a preset"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save
            </button>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-full h-8 px-3 text-[11px] font-bold bg-muted text-foreground"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            {customPresets.length > 0 && (
              <button
                onClick={() => setManageOpen(true)}
                className="inline-flex items-center gap-1 rounded-full h-8 px-2 text-[11px] font-bold text-muted-foreground hover:text-foreground"
                title="Manage saved presets"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {presetGroups.map((group) => {
            const items = allPresets.filter((p) => p.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="flex items-start gap-2">
                <span className="shrink-0 mt-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20">
                  {group}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((p) => {
                    const isActive = activePresetId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => applyPreset(p)}
                        className={`rounded-full px-3 h-8 text-[11px] font-bold border transition ${
                          isActive
                            ? "bg-primary text-primary-foreground border-transparent shadow-soft"
                            : "bg-muted text-foreground border-transparent hover:border-border"
                        }`}
                        aria-pressed={isActive}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
        {categories.map((c) => {
          const isActive = active === c.key;
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 h-9 text-xs font-bold transition border ${
                isActive
                  ? "bg-gradient-primary text-primary-foreground border-transparent shadow-soft"
                  : "bg-card text-foreground border-border"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 rounded-full bg-card border border-border h-9 pl-3 pr-2 text-xs font-bold text-foreground">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground font-semibold">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-transparent text-xs font-bold text-foreground focus:outline-none"
            aria-label="Sort listings"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={() => setFreeOnly((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full h-9 px-3 text-xs font-bold border transition ${
            freeOnly
              ? "bg-primary text-primary-foreground border-transparent"
              : "bg-card text-foreground border-border"
          }`}
          aria-pressed={freeOnly}
        >
          Free only
        </button>

        <label className="inline-flex items-center gap-2 rounded-full bg-card border border-border h-9 pl-3 pr-2 text-xs font-bold text-foreground">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
          <select
            value={minRating}
            onChange={(e) => setMinRating(parseFloat(e.target.value))}
            className="bg-transparent text-xs font-bold text-foreground focus:outline-none"
            aria-label="Minimum rating"
          >
            <option value={0}>Any rating</option>
            <option value={4}>4.0+</option>
            <option value={4.5}>4.5+</option>
            <option value={4.8}>4.8+</option>
          </select>
        </label>

        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-full h-9 px-3 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Pricing type">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-1">
          Pricing
        </span>
        {([
          { key: "all", label: "All prices" },
          { key: "fixed", label: "Fixed price" },
          { key: "from", label: "From €X" },
          { key: "quote", label: "Custom / quote" },
          { key: "free", label: "Free / included" },
        ] as { key: PriceType | "all"; label: string }[]).map((opt) => {
          const isOn = priceType === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setPriceType(opt.key)}
              className={`rounded-full px-3 h-8 text-[11px] font-bold border transition ${
                isOn
                  ? "bg-primary text-primary-foreground border-transparent shadow-soft"
                  : "bg-card text-foreground border-border hover:border-primary/40"
              }`}
              aria-pressed={isOn}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {allTags.map((t) => {
          const isOn = selectedTags.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border transition ${
                isOn
                  ? "bg-primary/10 text-primary border-primary/40"
                  : "bg-muted text-muted-foreground border-transparent hover:border-border"
              }`}
              aria-pressed={isOn}
            >
              {t}
            </button>
          );
        })}
      </div>
      </>
      )}

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {listings.length} listings
      </p>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">
          No listings match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 items-stretch">
          {filtered.map((l) => {
            const meta = categoryMeta[l.category];
            const Icon = meta.icon;
            const pType = getPriceType(l.price);
            const cartable = pType === "fixed" || pType === "from";
            const inCart = cartListings.some((c) => c.id === l.id);
            return (
              <div
                key={l.id}
                className="group h-full flex flex-col rounded-3xl bg-card border border-border shadow-card p-4 transition hover:border-primary/40 hover:shadow-soft hover:-translate-y-0.5"
              >
                <Link
                  to="/marketplace/$listingId"
                  params={{ listingId: l.id }}
                  className="flex flex-col flex-1"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                          {meta.label}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-muted-foreground">
                          <Star className="w-3 h-3 fill-current text-amber-500" />
                          {l.rating.toFixed(1)}
                        </span>
                      </div>
                      <h2 className="mt-0.5 text-base font-bold text-foreground line-clamp-2 break-words">
                        {l.title}
                      </h2>
                      <p className="text-xs text-muted-foreground truncate">by {l.provider}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-foreground/90 line-clamp-3">{l.tagline}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {l.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </Link>

                <div className="mt-auto pt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60">
                  <span className="text-sm font-bold text-foreground break-words">{l.price}</span>
                  <div className="flex items-center gap-1.5">
                    {cartable && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (inCart) return;
                          if (addToCart(l.id)) {
                            toast.success(`Added “${l.title}” to cart`);
                          }
                        }}
                        disabled={inCart}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold border transition whitespace-nowrap ${
                          inCart
                            ? "bg-muted text-muted-foreground border-transparent cursor-default"
                            : "bg-card text-foreground border-border hover:border-primary/40"
                        }`}
                        aria-label={inCart ? "In cart" : `Add ${l.title} to cart`}
                      >
                        {inCart ? (
                          <>
                            <CheckIcon className="w-3.5 h-3.5" />
                            In cart
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Add to cart
                          </>
                        )}
                      </button>
                    )}
                    <Link
                      to="/marketplace/$listingId"
                      params={{ listingId: l.id }}
                      className="inline-flex items-center gap-1 rounded-full bg-gradient-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-soft transition group-hover:shadow-elegant whitespace-nowrap"
                    >
                      View
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-3xl bg-gradient-deep p-5 text-primary-foreground shadow-elegant">
        <p className="text-xs font-bold uppercase tracking-widest text-white/80">
          List your offering
        </p>
        <h3 className="mt-2 text-lg font-bold text-white">
          Reach transformation leaders
        </h3>
        <p className="mt-1 text-sm text-white/85">
          Submit your agent, service, or playbook for review by the BizzSurfer team.
        </p>
        <Button
          onClick={() => setListOfferingOpen(true)}
          className="mt-4 w-full h-11 bg-white text-primary hover:bg-white/90 font-bold"
        >
          Apply to be listed
        </Button>
      </div>

      <ListYourOfferingDialog
        open={listOfferingOpen}
        onOpenChange={setListOfferingOpen}
      />

      {/* Save preset dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save filter preset</DialogTitle>
            <DialogDescription>
              Capture your current category, tags, sort and rating filters so you can
              switch back with one tap.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="preset-name" className="text-xs font-bold text-foreground">
              Preset name
            </label>
            <input
              id="preset-name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSavePreset();
              }}
              placeholder="e.g. My CMO shortlist"
              className="w-full h-10 rounded-xl bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              Includes: {active === "all" ? "all categories" : active},{" "}
              {selectedTags.length} tag{selectedTags.length === 1 ? "" : "s"},{" "}
              {freeOnly ? "free only, " : ""}
              {minRating > 0 ? `${minRating}+ rating, ` : ""}
              sort “{sortOptions.find((o) => o.value === sort)?.label}”.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
              Save preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage presets dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your saved presets</DialogTitle>
            <DialogDescription>
              Remove presets you no longer need. Built-in presets cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {customPresets.length === 0 && (
              <li className="text-sm text-muted-foreground">
                No custom presets yet.
              </li>
            )}
            {customPresets.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2"
              >
                <span className="text-sm font-bold text-foreground truncate">
                  {p.name}
                </span>
                <button
                  onClick={() => deletePreset(p.id)}
                  className="inline-flex items-center gap-1 rounded-full h-8 px-3 text-[11px] font-bold text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button onClick={() => setManageOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MarketplaceOnboarding
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onApply={handleOnboardingApply}
      />

      <MarketplaceCartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
