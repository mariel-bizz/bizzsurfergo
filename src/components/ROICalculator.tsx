import { useMemo, useState } from "react";
import { Calculator, TrendingUp } from "lucide-react";

export function ROICalculator() {
  const [employees, setEmployees] = useState(500);
  const [avgSalary, setAvgSalary] = useState(85000);
  const [hoursWasted, setHoursWasted] = useState(6);

  const result = useMemo(() => {
    const hourlyRate = avgSalary / 2080;
    const weeklyLoss = employees * hoursWasted * hourlyRate;
    const annualLoss = weeklyLoss * 48;
    // BizzSurfer recovers ~45% of wasted hours
    const annualRecovery = annualLoss * 0.45;
    return {
      annualLoss: Math.round(annualLoss),
      annualRecovery: Math.round(annualRecovery),
    };
  }, [employees, avgSalary, hoursWasted]);

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
      </div>

      <div className="mt-5 rounded-xl bg-gradient-deep p-4 text-primary-foreground">
        <p className="text-[11px] uppercase tracking-widest opacity-80 font-semibold">Estimated annual recovery</p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-bold">{fmt(result.annualRecovery)}</p>
          <TrendingUp className="w-4 h-4 opacity-80" />
        </div>
        <p className="mt-1 text-[11px] opacity-80">
          Out of {fmt(result.annualLoss)} lost annually to disconnected workflows.
        </p>
      </div>
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
