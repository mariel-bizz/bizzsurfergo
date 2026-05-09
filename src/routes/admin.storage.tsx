import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, Folder, FileIcon, Upload, Trash2, Download, RefreshCw, ArrowLeft, Search, X, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

function mimeCategory(m?: string): string {
  if (!m) return "other";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m === "application/pdf") return "pdf";
  if (m.startsWith("text/") || m.includes("json") || m.includes("xml") || m.includes("javascript")) return "text";
  return "other";
}

const BUCKET = "storage";

type Entry = {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  metadata: { size?: number; mimetype?: string } | null;
};

export const Route = createFileRoute("/admin/storage")({
  head: () => ({
    meta: [
      { title: "Storage Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AdminGate>
      <AdminStoragePage />
    </AdminGate>
  ),
});

function formatBytes(n?: number) {
  if (!n && n !== 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function AdminStoragePage() {
  const [prefix, setPrefix] = useState<string>("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: 200,
      sortBy: { column: "name", order: "asc" },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      setEntries([]);
      return;
    }
    setEntries((data ?? []).filter((e) => e.name !== ".emptyFolderPlaceholder") as Entry[]);
  }, [prefix]);

  useEffect(() => {
    load();
  }, [load]);

  const segments = prefix ? prefix.split("/").filter(Boolean) : [];

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let ok = 0;
    let fail = 0;
    for (const file of Array.from(files)) {
      const path = (prefix ? `${prefix}/` : "") + file.name;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: true,
        contentType: file.type || undefined,
      });
      if (error) {
        fail++;
        toast.error(`${file.name}: ${error.message}`);
      } else {
        ok++;
      }
    }
    setUploading(false);
    if (ok) toast.success(`Uploaded ${ok} file${ok > 1 ? "s" : ""}`);
    if (fileInputRef.current) fileInputRef.current.value = "";
    load();
  };

  const handleDelete = async (entry: Entry) => {
    const path = (prefix ? `${prefix}/` : "") + entry.name;
    if (!confirm(`Delete "${entry.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    load();
  };

  const handleDownload = async (entry: Entry) => {
    const path = (prefix ? `${prefix}/` : "") + entry.name;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60, {
      download: entry.name,
    });
    if (error || !data) {
      toast.error(error?.message ?? "Failed to create download link");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handlePreview = async (entry: Entry) => {
    const path = (prefix ? `${prefix}/` : "") + entry.name;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
    if (error || !data) {
      toast.error(error?.message ?? "Failed to preview");
      return;
    }
    setPreviewUrl(data.signedUrl);
    setPreviewName(entry.name);
  };

  const enterFolder = (name: string) => {
    setPrefix(prefix ? `${prefix}/${name}` : name);
    setPreviewUrl(null);
  };

  const goUp = () => {
    if (!prefix) return;
    const parts = prefix.split("/");
    parts.pop();
    setPrefix(parts.join("/"));
    setPreviewUrl(null);
  };

  const jumpTo = (idx: number) => {
    setPrefix(segments.slice(0, idx + 1).join("/"));
    setPreviewUrl(null);
  };

  const folders = entries.filter((e) => e.id === null);
  const allFiles = entries.filter((e) => e.id !== null);

  const [search, setSearch] = useState("");
  const [mimeFilter, setMimeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "size" | "updated">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const availableCategories = Array.from(
    new Set(allFiles.map((f) => mimeCategory(f.metadata?.mimetype)))
  ).sort();

  const q = search.trim().toLowerCase();
  const filteredFolders = q
    ? folders.filter((f) => f.name.toLowerCase().includes(q))
    : folders;
  const filteredFiles = allFiles.filter((f) => {
    if (q && !f.name.toLowerCase().includes(q)) return false;
    if (mimeFilter !== "all" && mimeCategory(f.metadata?.mimetype) !== mimeFilter) return false;
    return true;
  });

  const dir = sortDir === "asc" ? 1 : -1;
  const sortedFolders = [...filteredFolders].sort(
    (a, b) => a.name.localeCompare(b.name) * (sortBy === "name" ? dir : 1)
  );
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === "size") {
      return ((a.metadata?.size ?? 0) - (b.metadata?.size ?? 0)) * dir;
    }
    if (sortBy === "updated") {
      const at = a.updated_at ?? a.created_at ?? "";
      const bt = b.updated_at ?? b.created_at ?? "";
      return at.localeCompare(bt) * dir;
    }
    return a.name.localeCompare(b.name) * dir;
  });

  const totalShown = sortedFolders.length + sortedFiles.length;
  const isFiltering = q !== "" || mimeFilter !== "all";
  const isCustomized = isFiltering || sortBy !== "name" || sortDir !== "asc";
  const resetFilters = () => {
    setSearch("");
    setMimeFilter("all");
    setSortBy("name");
    setSortDir("asc");
  };

  return (
    <main className="container mx-auto max-w-5xl space-y-4 p-4 pb-24">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Storage Admin</h1>
        <p className="text-sm text-muted-foreground">
          Browse, upload, and manage files in the private <code className="rounded bg-muted px-1">{BUCKET}</code> bucket.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div className="flex items-center gap-1 text-sm flex-wrap">
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={() => { setPrefix(""); setPreviewUrl(null); }}
            >
              root
            </button>
            {segments.map((s, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <button className="hover:underline" onClick={() => jumpTo(i)}>{s}</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            {prefix && (
              <Button size="sm" variant="outline" onClick={goUp}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Up
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
              className="flex-1"
            />
            <Button disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Files upload to <code>{prefix || "(root)"}</code>. Existing names are overwritten.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Contents</span>
            <Badge variant="secondary">
              {isFiltering ? `${totalShown} of ${entries.length}` : `${entries.length} item${entries.length === 1 ? "" : "s"}`}
            </Badge>
          </CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by filename…"
                className="pl-8 pr-8"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={mimeFilter} onValueChange={setMimeFilter}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {availableCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort: Name</SelectItem>
                <SelectItem value="size">Sort: Size</SelectItem>
                <SelectItem value="updated">Sort: Modified</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              aria-label={`Sort ${sortDir === "asc" ? "ascending" : "descending"}`}
              title={sortDir === "asc" ? "Ascending" : "Descending"}
            >
              {sortDir === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              disabled={!isCustomized}
              title="Reset search, type, and sorting"
            >
              Reset filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">This folder is empty.</p>
          ) : totalShown === 0 ? (
            <p className="text-sm text-muted-foreground">No items match your filters.</p>
          ) : (
            <ul className="divide-y">
              {sortedFolders.map((e) => (
                <li key={`f-${e.name}`} className="flex items-center justify-between gap-2 py-2">
                  <button
                    onClick={() => enterFolder(e.name)}
                    className="flex flex-1 items-center gap-2 text-left hover:underline"
                  >
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{e.name}/</span>
                  </button>
                </li>
              ))}
              {sortedFiles.map((e) => (
                <li key={`x-${e.name}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <button
                    onClick={() => handlePreview(e)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{e.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground sm:ml-0">
                      {formatBytes(e.metadata?.size)}
                    </span>
                  </button>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleDownload(e)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(e)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {previewUrl && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base truncate">Preview: {previewName}</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setPreviewUrl(null)}>Close</Button>
          </CardHeader>
          <CardContent>
            {/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(previewName) ? (
              <img src={previewUrl} alt={previewName} className="max-h-[600px] w-auto rounded border" />
            ) : /\.(mp4|webm|mov)$/i.test(previewName) ? (
              <video src={previewUrl} controls className="max-h-[600px] w-full rounded border" />
            ) : /\.(pdf)$/i.test(previewName) ? (
              <iframe src={previewUrl} className="h-[600px] w-full rounded border" title={previewName} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Preview not available for this file type.{" "}
                <a className="underline" href={previewUrl} target="_blank" rel="noreferrer">Open in new tab</a>
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
