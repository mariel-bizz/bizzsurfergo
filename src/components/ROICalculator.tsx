import { useState } from "react";
import { Calculator, TrendingUp, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ROICalculator() {
  const [employees, setEmployees] = useState(500);
  const [avgSalary, setAvgSalary] = useState(85000);
  const [hoursWasted, setHoursWasted] = useState(6);
  const [efficiencyGain, setEfficiencyGain] = useState(45);
  const [automationLevel, setAutomationLevel] = useState(30);
  const [result, setResult] = useState<{ annualLoss: number; annualRecovery: number } | null>(null);

  const calculate = () => {
    const hourlyRate = avgSalary / 2080;
    const weeklyLoss = employees * hoursWasted * hourlyRate;
    const annualLoss = weeklyLoss * 48;
    // Combined recovery factor: efficiency gain plus automation uplift
    const recoveryFactor = Math.min(0.95, (efficiencyGain / 100) + (automationLevel / 100) * 0.5);
    const annualRecovery = annualLoss * recoveryFactor;
    setResult({
      annualLoss: Math.round(annualLoss),
      annualRecovery: Math.round(annualRecovery),
    });
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
          <Calculator className="w-4 h-4 text-primary-foreground" />
        </div>
        <h3 className="text-base font-bold text-foreground">ROI Calculator</h3>
      </div>

      <div className="space-y-3">
        <Field label="Employees impacted" value={employees} min={10} max={50000} step={10} onChange={setEmployees} />
        <Field label="Avg. annual salary (USD)" value={avgSalary} min={30000} max={300000} step={1000} onChange={setAvgSalary} />
        <Field label="Hours wasted per week / person" value={hoursWasted} min={1} max={20} step={1} onChange={setHoursWasted} />
        <Field label="Expected Efficiency Gain (%)" value={efficiencyGain} min={5} max={90} step={1} onChange={setEfficiencyGain} />
        <Field label="Level expected of automations (%)" value={automationLevel} min={0} max={100} step={1} onChange={setAutomationLevel} />
      </div>

      {result ? (
        <button
          type="button"
          onClick={calculate}
          className="mt-5 w-full text-left rounded-xl bg-gradient-deep p-4 text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99]"
          aria-label="Recalculate ROI"
        >
          <p className="text-[11px] uppercase tracking-widest opacity-80 font-semibold">Estimated annual recovery</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold">{fmt(result.annualRecovery)}</p>
            <TrendingUp className="w-4 h-4 opacity-80" />
          </div>
          <p className="mt-1 text-[11px] opacity-80">
            Out of {fmt(result.annualLoss)} lost annually to disconnected workflows. Tap to recalculate.
          </p>
        </button>
      ) : (
        <button
          type="button"
          onClick={calculate}
          className="mt-5 w-full rounded-xl bg-gradient-deep p-4 text-primary-foreground font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <Calculator className="w-4 h-4" />
          Calculate my ROI
        </button>
      )}
    </div>
  );
}

function Field({
  label, value, min, max, step, onChange,
}: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-foreground">{label}</label>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-24 text-right text-xs font-bold text-primary bg-transparent border-b border-border focus:outline-none focus:border-primary"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}
