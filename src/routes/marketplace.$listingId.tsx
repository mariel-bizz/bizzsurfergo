import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-head";
import { categoryMeta, getListing, type Listing } from "@/lib/marketplace-data";
import { ListingActionDialog } from "@/components/marketplace/ListingActionDialog";

export const Route = createFileRoute("/marketplace/$listingId")({
  loader: ({ params }) => {
    const listing = getListing(params.listingId);
    if (!listing) throw notFound();
    return { listing };
  },
  head: ({ loaderData }) => {
    const l = loaderData?.listing;
    return pageHead({
      path: `/marketplace/${l?.id ?? ""}`,
      title: l ? `${l.title} — Marketplace` : "Listing — Marketplace",
      description: l?.tagline ?? "Marketplace listing on BizzSurfer Go!",
      breadcrumbName: l?.title ?? "Listing",
    });
  },
  notFoundComponent: () => (
    <div className="px-5 py-10 text-center space-y-3">
      <h1 className="text-xl font-bold text-foreground">Listing not found</h1>
      <p className="text-sm text-muted-foreground">
        That marketplace item doesn't exist or has been removed.
      </p>
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-1 text-sm font-bold text-primary"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="px-5 py-10 text-center text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
  component: ListingDetail,
});

function ListingDetail() {
  const { listing } = Route.useLoaderData() as { listing: Listing };
  const meta = categoryMeta[listing.category];
  const Icon = meta.icon;
  const isDownload = listing.category === "templates";
  const ActionIcon = isDownload ? Download : ArrowRight;

  const handleAction = () => {
    if (isDownload) {
      toast.success(`${listing.title} download starting…`, {
        description: "Check your email for the file link.",
      });
    } else if (listing.category === "agents") {
      toast.success(`${listing.title} installed`, {
        description: "Open your workspace to configure it.",
      });
    } else {
      toast.success("Intro requested", {
        description: `${listing.provider} will reach out within 1 business day.`,
      });
    }
  };

  return (
    <div className="px-5 py-5 space-y-5">
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Marketplace
      </Link>

      <header className="rounded-3xl bg-card border border-border shadow-card p-5">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {meta.label}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-muted-foreground">
                <Star className="w-3 h-3 fill-current text-amber-500" />
                {listing.rating.toFixed(1)}
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold text-foreground">
              {listing.title}
            </h1>
            <p className="text-xs text-muted-foreground">by {listing.provider}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-foreground/90">{listing.tagline}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {listing.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </header>

      <section className="rounded-3xl bg-card border border-border shadow-card p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Description
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">
          {listing.description}
        </p>
      </section>

      <section className="rounded-3xl bg-card border border-border shadow-card p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Requirements
        </h2>
        <ul className="mt-3 space-y-2">
          {listing.requirements.map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm text-foreground/90">
              <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="sticky bottom-4 rounded-3xl bg-gradient-deep p-4 text-primary-foreground shadow-elegant flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
            Price
          </p>
          <p className="text-base font-bold text-white">{listing.price}</p>
        </div>
        <Button
          onClick={handleAction}
          className="h-11 px-5 bg-white text-primary hover:bg-white/90 font-bold"
        >
          <ActionIcon className="w-4 h-4 mr-1.5" />
          {listing.cta}
        </Button>
      </div>
    </div>
  );
}
