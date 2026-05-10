import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { type EngagementProfile, saveProfile } from "@/lib/insights-engagement";

export function EngagementProfileDialog({
  open,
  initial,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  initial?: EngagementProfile | null;
  onOpenChange: (v: boolean) => void;
  onSubmit: (p: EngagementProfile) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [position, setPosition] = useState(initial?.position ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const p = { name: name.trim(), position: position.trim(), company: company.trim() };
    saveProfile(p);
    onSubmit(p);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tell us a bit about you</DialogTitle>
          <DialogDescription>
            Used so your name shows on likes and comments. Stored on this device.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="eng-name">Full name</Label>
            <Input id="eng-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="eng-position">Position</Label>
            <Input id="eng-position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Head of Transformation" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="eng-company">Company</Label>
            <Input id="eng-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp" />
          </div>
          <DialogFooter>
            <Button type="submit">Continue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
