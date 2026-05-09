import { useMemo, useState } from "react";
import { Calculator, TrendingUp, Info, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export function ROICalculator() {
  const [employees, setEmployees] = useState(500);
  const [avgSalary, setAvgSalary] = useState(85000);
  const [hoursWasted, setHoursWasted] = useState(6);
  const [efficiencyGain, setEfficiencyGain] = useState(45);
  const [automationLevel, setAutomationLevel] = useState(30);
  const [calculated, setCalculated] = useState(false);

  // Always compute live values for the visualization
  const live = useMemo(() => {
    const hourlyRate = avgSalary / 2080;
    const weeklyLoss = employees * hoursWasted * hourlyRate;
    const annualLoss = weeklyLoss * 48;
    const recoveryFactor = Math.min(0.95, (efficiencyGain / 100) + (automationLevel / 100) * 0.5);
    const annualRecovery = annualLoss * recoveryFactor;
    return {
      annualLoss: Math.round(annualLoss),
      annualRecovery: Math.round(annualRecovery),
      recoveryFactor,
    };
  }, [employees, avgSalary, hoursWasted, efficiencyGain, automationLevel]);

  const calculate = () => setCalculated(true);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const downloadPDF = () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const left = 48;
      let y = 64;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("BizzSurfer ROI Report", left, y);
      y += 28;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated ${new Date().toLocaleDateString()}`, left, y);
      y += 28;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Inputs", left, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const rows: [string, string][] = [
        ["Employees impacted", employees.toLocaleString()],
        ["Average annual salary", fmt(avgSalary)],
        ["Hours wasted / week / person", `${hoursWasted} h`],
        ["Expected efficiency gain", `${efficiencyGain}%`],
        ["Expected automation level", `${automationLevel}%`],
      ];
      rows.forEach(([k, v]) => { doc.text(`${k}: ${v}`, left, y); y += 16; });

      y += 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Results", left, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Recovery factor: ${(live.recoveryFactor * 100).toFixed(1)}%`, left, y); y += 16;
      doc.text(`Estimated annual loss: ${fmt(live.annualLoss)}`, left, y); y += 16;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 120, 80);
      doc.text(`Estimated annual recovery: ${fmt(live.annualRecovery)}`, left, y);
      doc.setTextColor(0, 0, 0);
      y += 28;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text(
        "Formula: Recovery factor = Efficiency Gain + (Automation Level / 2), capped at 95%.",
        left, y
      );
      y += 14;
      doc.text("Applied to annual loss = Employees x Hours/week x (Salary/2080) x 48 weeks.", left, y);

      doc.save(`bizzsurfer-roi-${Date.now()}.pdf`);
      toast.success("ROI report downloaded.");
    } catch (e) {
      toast.error("Could not generate PDF.");
    }
  };

  // Visualization geometry
  const max = Math.max(live.annualLoss, 1);
  const lossPct = 100;
  const recPct = (live.annualRecovery / max) * 100;

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
          <Calculator className="w-4 h-4 text-primary-foreground" />
        </div>
        <h3 className="text-base font-bold text-foreground">ROI Calculator</h3>
      </div>

      <TooltipProvider delayDuration={150}>
        <div className="space-y-3">
          <Field label="Employees impacted" value={employees} min={10} max={50000} step={10} onChange={setEmployees} />
          <Field label="Avg. annual salary (USD)" value={avgSalary} min={30000} max={300000} step={1000} onChange={setAvgSalary} />
          <Field label="Hours wasted per week / person" value={hoursWasted} min={1} max={20} step={1} onChange={setHoursWasted} />
          <Field
            label="Expected Efficiency Gain (%)"
            value={efficiencyGain}
            min={5}
            max={90}
            step={1}
            onChange={setEfficiencyGain}
            tooltip="Share of wasted hours BizzSurfer helps you reclaim through better workflows. Contributes 1:1 to the recovery factor (e.g. 45% efficiency gain = 0.45)."
          />
          <Field
            label="Level expected of automations (%)"
            value={automationLevel}
            min={0}
            max={100}
            step={1}
            onChange={setAutomationLevel}
            tooltip="How much of your repetitive work you plan to automate. Adds half its value to the recovery factor (e.g. 30% automation = +0.15). Total recovery is capped at 95%."
          />
        </div>
      </TooltipProvider>

      {/* Live breakdown visualization — only after calculate */}
      {calculated && (
        <>
          <div className="mt-5 rounded-xl border border-border bg-muted/30 p-3 animate-fade-in">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
              Live breakdown
            </p>
            <div className="space-y-2.5">
              <BarRow
                label="Lost annually"
                value={fmt(live.annualLoss)}
                pct={lossPct}
                barClass="bg-destructive/80"
              />
              <BarRow
                label="Recovered with BizzSurfer"
                value={fmt(live.annualRecovery)}
                pct={recPct}
                barClass="bg-gradient-primary"
              />
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Recovery factor: <span className="font-semibold text-foreground">{(live.recoveryFactor * 100).toFixed(0)}%</span>
              {" "}· Updates as you move the sliders.
            </p>
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed animate-fade-in">
            <span className="font-semibold text-foreground">Recovery factor</span> = Efficiency Gain + (Automation Level ÷ 2), capped at 95%. Applied to your total annual loss to estimate yearly recovery.
          </p>
        </>
      )}

      {calculated ? (
        <>
          <button
            type="button"
            onClick={calculate}
            className="mt-5 w-full text-left rounded-xl bg-gradient-deep p-4 text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99]"
            aria-label="Recalculate ROI"
          >
            <p className="text-[11px] uppercase tracking-widest opacity-80 font-semibold">Estimated annual recovery</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold">{fmt(live.annualRecovery)}</p>
              <TrendingUp className="w-4 h-4 opacity-80" />
            </div>
            <p className="mt-1 text-[11px] opacity-80">
              Out of {fmt(live.annualLoss)} lost annually to disconnected workflows. Tap to recalculate.
            </p>
          </button>
          <Button
            type="button"
            variant="outline"
            onClick={downloadPDF}
            className="mt-3 w-full h-11 font-semibold"
          >
            <Download className="w-4 h-4" /> Download PDF report
          </Button>
        </>
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

function BarRow({ label, value, pct, barClass }: { label: string; value: string; pct: number; barClass: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="font-bold text-foreground">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${barClass} transition-all duration-300`}
          style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

function Field({
  label, value, min, max, step, onChange, tooltip,
}: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; tooltip?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-semibold text-foreground">{label}</label>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label={`About ${label}`} className="text-muted-foreground hover:text-primary">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px] text-xs leading-snug">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
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
