import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/resources")({
  head: () =>
    pageHead({
      path: "/resources",
      title: "Blog & Resources — BizzSurfer Go!",
      description:
        "Insights, articles and resources from BizzSurfer for transformation leaders exploring Agentic AI.",
      breadcrumbName: "Blog & Resources",
    }),
  component: ResourcesPage,
});

function ResourcesPage() {
  return (
    <section className="px-4 pt-4 pb-2">
      <header className="mb-3">
        <h1 className="text-2xl font-bold text-foreground">Blog &amp; Resources</h1>
        <p className="text-sm text-muted-foreground">
          Latest insights from BizzSurfer.
        </p>
      </header>
      <div className="rounded-2xl overflow-hidden border border-border shadow-elegant bg-card">
        <iframe
          src="https://bizzsurfer.com/insights"
          title="BizzSurfer Insights"
          className="w-full h-[75vh] bg-background"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Having trouble viewing?{" "}
        <a
          href="https://bizzsurfer.com/insights"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold underline"
        >
          Open on bizzsurfer.com
        </a>
      </p>
    </section>
  );
}
