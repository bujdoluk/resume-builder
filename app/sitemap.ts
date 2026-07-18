/**
 * Generates `/sitemap.xml` listing the site's public routes (landing page,
 * templates gallery, editor) with their change frequency and priority,
 * plus one entry per blog post — needed since posts are admin-created at
 * runtime and app/blog/[slug]/page.tsx has no generateStaticParams to
 * otherwise enumerate them for crawlers.
 */
import type { MetadataRoute } from "next";
import { Temporal } from "temporal-polyfill";
import { createClient } from "@/lib/supabase/server";
import { getBlogPosts } from "@/lib/supabase/blogPosts";

const baseUrl = "https://www.quickresumebuilder.online";
const lastModified = Temporal.Now.instant().toString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const posts = await getBlogPosts(supabase);

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/templates`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/app`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
