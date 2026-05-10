import { createServerFn } from "@tanstack/react-start";
import { fetchBlogPosts, fetchBlogPostBySlug } from "./contentful.server";

export const getBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  return await fetchBlogPosts();
});

export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => {
    if (!data || typeof data.slug !== "string" || !data.slug.trim()) {
      throw new Error("slug is required");
    }
    return { slug: data.slug.trim() };
  })
  .handler(async ({ data }) => {
    return await fetchBlogPostBySlug(data.slug);
  });
