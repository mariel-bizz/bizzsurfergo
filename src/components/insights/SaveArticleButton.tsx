import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSaved, saveSlug, unsaveSlug } from "@/lib/saved-insights";
import { toast } from "sonner";

export function SaveArticleButton({ slug }: { slug: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    isSaved(slug).then((s) => alive && setSaved(s));
    return () => {
      alive = false;
    };
  }, [slug]);

  const toggle = async () => {
    setBusy(true);
    try {
      if (saved) {
        await unsaveSlug(slug);
        setSaved(false);
        toast.success("Removed from saved");
      } else {
        await saveSlug(slug);
        setSaved(true);
        toast.success("Saved to your reading list");
      }
    } catch (e) {
      toast.error((e as Error).message || "Could not update saved list");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant={saved ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
    >
      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      <span className="ml-1.5">{saved ? "Saved" : "Save"}</span>
    </Button>
  );
}
