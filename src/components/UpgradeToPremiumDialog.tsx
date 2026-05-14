import { useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PREMIUM_BENEFITS = [
  { label: "ERP connectors", desc: "SAP, Oracle, NetSuite, Dynamics" },
  { label: "CRM connectors", desc: "Salesforce, HubSpot, Pipedrive" },
  { label: "HRIS connectors", desc: "Workday, BambooHR, Personio" },
  { label: "BI & analytics", desc: "Looker, Power BI, Tableau, Amplitude" },
];

export function UpgradeToPremiumDialog({
  open,
  onOpenChange,
  title = "Only available for Premium Plans",
  description = "Upgrade to unlock integrations across your enterprise stack:",
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title?: string;
  description?: string;
}) {
  const navigate = useNavigate();
  const goPricing = () => {
    onOpenChange(false);
    navigate({ to: "/pricing" });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="space-y-2 -mt-1">
          {PREMIUM_BENEFITS.map((b) => (
            <li key={b.label} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground leading-tight">{b.label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{b.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={goPricing}
          className="text-xs font-semibold text-primary underline-offset-2 hover:underline text-left"
        >
          Compare all plans →
        </button>

        <AlertDialogFooter>
          <AlertDialogCancel>Not now</AlertDialogCancel>
          <AlertDialogAction onClick={goPricing}>Upgrade NOW</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
