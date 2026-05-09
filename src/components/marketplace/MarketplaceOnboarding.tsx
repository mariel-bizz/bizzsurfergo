import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { builtInPresets, defaultState, type Preset, type PresetState } from "@/lib/marketplace-presets";
import { Sparkles } from "lucide-react";

const ONBOARDING_KEY = "bizzsurfer.marketplace.onboarding.v1";

type RoleId = "cxo" | "product" | "engineer" | "skip";
type DeptId = "marketing" | "sales" | "ops" | "hr" | "skip";
type TxId = "quickwins" | "pilots" | "enterprise" | "playbooks" | "skip";

const roles: { id: RoleId; label: string; presetId?: string }[] = [
  { id: "cxo", label: "C-suite / Executive", presetId: "role-cxo" },
  { id: "product", label: "Product Manager", presetId: "role-product" },
  { id: "engineer", label: "Engineer / Builder", presetId: "role-engineer" },
  { id: "skip", label: "Other / Skip" },
];

const depts: { id: DeptId; label: string; presetId?: string }[] = [
  { id: "marketing", label: "Marketing", presetId: "dept-marketing" },
  { id: "sales", label: "Sales & Revenue", presetId: "dept-sales" },
  { id: "ops", label: "Operations", presetId: "dept-ops" },
  { id: "hr", label: "People & HR", presetId: "dept-hr" },
  { id: "skip", label: "Other / Skip" },
];

const txs: { id: TxId; label: string; presetId?: string }[] = [
  { id: "quickwins", label: "Quick wins (free tools)", presetId: "tx-quickwins" },
  { id: "pilots", label: "Pilot programs", presetId: "tx-pilots" },
  { id: "enterprise", label: "Enterprise rollout", presetId: "tx-enterprise" },
  { id: "playbooks", label: "Playbooks & templates", presetId: "tx-playbooks" },
  { id: "skip", label: "Not sure yet" },
];

export function hasCompletedMarketplaceOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  return !!localStorage.getItem(ONBOARDING_KEY);
}

function presetById(id?: string): Preset | undefined {
  if (!id) return undefined;
  return builtInPresets.find((p) => p.id === id);
}

// Merge: role -> dept (overlay tags) -> transformation (overlay tags + structural settings).
// Returns the synthesized state plus the most specific preset id (for activePreset highlight).
function buildBestMatch(
  roleId: RoleId,
  deptId: DeptId,
  txId: TxId,
): { state: PresetState; bestPresetId: string | null } {
  const rolePreset = presetById(roles.find((r) => r.id === roleId)?.presetId);
  const deptPreset = presetById(depts.find((d) => d.id === deptId)?.presetId);
  const txPreset = presetById(txs.find((t) => t.id === txId)?.presetId);

  let state: PresetState = { ...defaultState };
  const tagSet = new Set<string>();

  if (rolePreset) {
    state = { ...state, ...rolePreset.state, selectedTags: [...rolePreset.state.selectedTags] };
    rolePreset.state.selectedTags.forEach((t) => tagSet.add(t));
  }
  if (deptPreset) {
    // Overlay non-default structural fields when set.
    if (deptPreset.state.category !== "all") state.category = deptPreset.state.category;
    if (deptPreset.state.sort !== "recommended") state.sort = deptPreset.state.sort;
    if (deptPreset.state.freeOnly) state.freeOnly = true;
    if (deptPreset.state.minRating > state.minRating) state.minRating = deptPreset.state.minRating;
    deptPreset.state.selectedTags.forEach((t) => tagSet.add(t));
  }
  if (txPreset) {
    if (txPreset.state.category !== "all") state.category = txPreset.state.category;
    if (txPreset.state.sort !== "recommended") state.sort = txPreset.state.sort;
    if (txPreset.state.freeOnly) state.freeOnly = true;
    if (txPreset.state.minRating > state.minRating) state.minRating = txPreset.state.minRating;
    txPreset.state.selectedTags.forEach((t) => tagSet.add(t));
  }

  state.selectedTags = Array.from(tagSet);

  const bestPresetId = txPreset?.id ?? deptPreset?.id ?? rolePreset?.id ?? null;
  return { state, bestPresetId };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (state: PresetState, bestPresetId: string | null, label: string) => void;
};

export function MarketplaceOnboarding({ open, onOpenChange, onApply }: Props) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<RoleId | null>(null);
  const [dept, setDept] = useState<DeptId | null>(null);
  const [tx, setTx] = useState<TxId | null>(null);

  useEffect(() => {
    if (open) {
      setStep(0);
      setRole(null);
      setDept(null);
      setTx(null);
    }
  }, [open]);

  function markDone() {
    if (typeof window !== "undefined") localStorage.setItem(ONBOARDING_KEY, "1");
  }

  function finish(rid: RoleId, did: DeptId, tid: TxId) {
    const { state, bestPresetId } = buildBestMatch(rid, did, tid);
    const labelParts = [
      roles.find((r) => r.id === rid && r.id !== "skip")?.label,
      depts.find((d) => d.id === did && d.id !== "skip")?.label,
      txs.find((t) => t.id === tid && t.id !== "skip")?.label,
    ].filter(Boolean) as string[];
    const label = labelParts.join(" · ") || "your selections";
    markDone();
    onApply(state, bestPresetId, label);
    onOpenChange(false);
  }

  function skipAll() {
    markDone();
    onOpenChange(false);
  }

  const steps: {
    title: string;
    description: string;
    options: { id: string; label: string }[];
    pick: (id: string) => void;
  }[] = [
    {
      title: "What's your role?",
      description: "We'll tailor the marketplace to what matters for you.",
      options: roles,
      pick: (id) => {
        setRole(id as RoleId);
        setStep(1);
      },
    },
    {
      title: "Which department?",
      description: "Helps us surface the right templates and services.",
      options: depts,
      pick: (id) => {
        setDept(id as DeptId);
        setStep(2);
      },
    },
    {
      title: "Your transformation focus?",
      description: "We'll auto-apply a matching preset.",
      options: txs,
      pick: (id) => {
        const finalTx = id as TxId;
        setTx(finalTx);
        finish(role ?? "skip", dept ?? "skip", finalTx);
      },
    },
  ];

  const current = steps[step];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-primary text-primary-foreground">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Step {step + 1} of {steps.length}
            </div>
          </div>
          <DialogTitle className="text-lg">{current.title}</DialogTitle>
          <DialogDescription>{current.description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-2 py-2">
          {current.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => current.pick(opt.id)}
              className="text-left rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-accent/40 transition px-4 py-3 text-sm font-semibold text-foreground"
            >
              {opt.label}
            </button>
          ))}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (step === 0 ? skipAll() : setStep((s) => Math.max(0, s - 1)))}
          >
            {step === 0 ? "Skip for now" : "Back"}
          </Button>
          <Button variant="ghost" size="sm" onClick={skipAll}>
            Skip onboarding
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
