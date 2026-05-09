import { useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

import { MessageCircle } from "lucide-react";
import { ChatTab } from "./tabs/ChatTab";

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Don't show on the dedicated chat page (it's already there)
  if (location.pathname === "/chat") return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open BizzSurfer Go! chat"
          className="fixed z-40 right-4 bottom-24 w-14 h-14 rounded-full bg-gradient-primary shadow-elegant flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <MessageCircle className="w-6 h-6 text-primary-foreground" strokeWidth={2.4} />
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground text-[9px] font-bold uppercase tracking-wider shadow-soft">
            Go!
          </span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="p-0 h-[88vh] max-w-md mx-auto rounded-t-3xl border-t border-border bg-background"
      >
        <SheetTitle className="sr-only">BizzSurfer Go! Chat</SheetTitle>
        <div className="h-full overflow-hidden">
          <ChatTab />
        </div>
      </SheetContent>
    </Sheet>
  );
}
