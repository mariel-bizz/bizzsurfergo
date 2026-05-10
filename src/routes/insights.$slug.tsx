import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES, MARKS } from "@contentful/rich-text-types";
import type { Block, Inline } from "@contentful/rich-text-types";
import type { ReactNode } from "react";
import { pageHead } from "@/lib/page-head";
import { getBlogPost } from "@/lib/contentful.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowLeft, Calendar, User } from "lucide-react";
import { CtaBlock } from "./insights.index";

export const Route = createFileRoute("/insights/$slug")({
  head: ({ params }) =>
    pageHead({
      path: `/insights/${params.slug}`,
      title: `Insights — BizzSurfer Go!`,
      description: "Read the latest insights from BizzSurfer.",
      breadcrumbName: "Article",
    }),
  component: ArticlePage,
  notFoundComponent: () => (
    <div className="px-4 py-12 text-center">
      <h1 className="text-xl font-bold">Article not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This article may have been removed or the link is incorrect.
      </p>
      <Button asChild className="mt-4">
        <Link to="/insights">Back to insights</Link>
      </Button>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="px-4 py-10 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
        <h1 className="mt-3 text-lg font-bold">Couldn't load article</h1>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        <Button
          className="mt-4"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Retry
        </Button>
      </div>
    );
  },
});

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function prettyCategory(c: string | null) {
  if (!c) return "";
  return c
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

const richTextOptions = {
  renderMark: {
    [MARKS.BOLD]: (text: ReactNode) => <strong className="font-semibold">{text}</strong>,
    [MARKS.ITALIC]: (text: ReactNode) => <em>{text}</em>,
    [MARKS.CODE]: (text: ReactNode) => (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">{text}</code>
    ),
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (_n: Block | Inline, children: ReactNode) => (
      <p className="my-3 leading-relaxed text-foreground">{children}</p>
    ),
    [BLOCKS.HEADING_1]: (_n: Block | Inline, children: ReactNode) => (
      <h1 className="mt-6 mb-3 text-2xl font-bold">{children}</h1>
    ),
    [BLOCKS.HEADING_2]: (_n: Block | Inline, children: ReactNode) => (
      <h2 className="mt-6 mb-3 text-xl font-bold">{children}</h2>
    ),
    [BLOCKS.HEADING_3]: (_n: Block | Inline, children: ReactNode) => (
      <h3 className="mt-5 mb-2 text-lg font-bold">{children}</h3>
    ),
    [BLOCKS.UL_LIST]: (_n: Block | Inline, children: ReactNode) => (
      <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>
    ),
    [BLOCKS.OL_LIST]: (_n: Block | Inline, children: ReactNode) => (
      <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>
    ),
    [BLOCKS.QUOTE]: (_n: Block | Inline, children: ReactNode) => (
      <blockquote className="my-4 border-l-4 border-primary pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
    [BLOCKS.HR]: () => <hr className="my-6 border-border" />,
    [INLINES.HYPERLINK]: (node: Block | Inline, children: ReactNode) => (
      <a
        href={(node.data as { uri: string }).uri}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline-offset-2 hover:underline"
      >
        {children}
      </a>
    ),
  },
};

function ArticlePage() {
  const { slug } = Route.useParams();
  const fetchPost = useServerFn(getBlogPost);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const post = await fetchPost({ data: { slug } });
      if (!post) throw notFound();
      return post;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <article className="px-4 py-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-8 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/2" />
        <Skeleton className="mt-4 aspect-video w-full" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </article>
    );
  }

  if (isError) {
    return (
      <div className="px-4 py-10 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
        <h1 className="mt-3 text-lg font-bold">Couldn't load article</h1>
        <p className="mt-1 text-sm text-muted-foreground">{(error as Error).message}</p>
        <Button className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <ArticleHead post={data} />
      <article className="px-4 py-4">
        <Link
          to="/insights"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" /> All insights
        </Link>

        <header className="mt-3">
          {data.category && (
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
              {prettyCategory(data.category)}
            </Badge>
          )}
          <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{data.title}</h1>
          {data.excerpt && (
            <p className="mt-2 text-base text-muted-foreground">{data.excerpt}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {data.author && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3" /> {data.author}
              </span>
            )}
            {data.publishedDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {formatDate(data.publishedDate)}
              </span>
            )}
          </div>
        </header>

        {data.featuredImage && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-muted">
            <img
              src={`${data.featuredImage.url}?w=1200&fm=webp&q=80`}
              alt={data.featuredImage.alt}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="mt-4 max-w-prose text-[15px]">
          {data.body ? (
            documentToReactComponents(data.body, richTextOptions)
          ) : (
            <p className="text-muted-foreground">No content available.</p>
          )}
        </div>

        <CtaBlock />
      </article>
    </>
  );
}

function ArticleHead({ post }: { post: { metaTitle: string | null; title: string; metaDescription: string | null; excerpt: string; featuredImage: { url: string } | null; slug: string } }) {
  const title = post.metaTitle || `${post.title} — BizzSurfer Go!`;
  const desc = post.metaDescription || post.excerpt;
  const url = `https://bizzsurfergo.lovable.app/insights/${post.slug}`;
  const image = post.featuredImage ? `${post.featuredImage.url}?w=1200&fm=jpg&q=80` : null;
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="article" />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
      <link rel="canonical" href={url} />
    </>
  );
}
