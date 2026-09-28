import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { Temporal } from "temporal-polyfill";
import { BLOG_POSTS_CACHE_TAG, BLOG_POSTS_CACHE_REVALIDATE_SECONDS, MAX_SLUG_ATTEMPTS } from "@/lib/constants";
import type { Database, Tables } from "@/lib/supabase/database.types";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import type { Blog, BlogCategoryKey, BlogPost } from "@/types/blog";

export const blogCategories: BlogCategoryKey[] = [
  "resumeTips",
  "coverLetters",
  "interviewPrep",
  "careerAdvice",
  "jobSearch",
];

export const categoryBadgeClass: Record<BlogCategoryKey, string> = {
  resumeTips: "badge-primary",
  coverLetters: "badge-secondary",
  interviewPrep: "badge-accent",
  careerAdvice: "badge-info",
  jobSearch: "badge-success",
};

const SELECT_COLUMNS =
  "id, slug, category, title, subtitle, content, author_name, author_avatar_url, read_time, published_at";

// The typed client can't infer a shape from a column string, so keep this in sync with the table.
type BlogPostSelectedRow = Pick<
  Tables<"blog_posts">,
  | "id"
  | "slug"
  | "category"
  | "title"
  | "subtitle"
  | "content"
  | "author_name"
  | "author_avatar_url"
  | "read_time"
  | "published_at"
>;

// category is text with a CHECK constraint, so narrow the generated string type.
function toCategory(value: string): BlogCategoryKey {
  return (blogCategories as string[]).includes(value) ? (value as BlogCategoryKey) : "resumeTips";
}

function mapRow(row: BlogPostSelectedRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    category: toCategory(row.category),
    title: row.title,
    subtitle: row.subtitle,
    content: row.content,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url,
    readTime: row.read_time,
    publishedAt: row.published_at,
  };
}

export async function getBlogPosts(supabase: SupabaseClient<Database>): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(SELECT_COLUMNS)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data as BlogPostSelectedRow[]).map(mapRow);
}

export async function getBlogPostBySlug(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(SELECT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data as BlogPostSelectedRow) : null;
}

export const getCachedBlogPosts = unstable_cache(
  () => getBlogPosts(createServiceRoleClient()),
  ["blog-posts"],
  { tags: [BLOG_POSTS_CACHE_TAG], revalidate: BLOG_POSTS_CACHE_REVALIDATE_SECONDS },
);

export const getCachedBlogPostBySlug = unstable_cache(
  (slug: string) => getBlogPostBySlug(createServiceRoleClient(), slug),
  ["blog-post-by-slug"],
  { tags: [BLOG_POSTS_CACHE_TAG], revalidate: BLOG_POSTS_CACHE_REVALIDATE_SECONDS },
);

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "post";
}

export async function createBlogPost(
  supabase: SupabaseClient<Database>,
  blog: Blog,
): Promise<BlogPost> {
  const base = slugify(blog.title);

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        slug,
        category: blog.category,
        title: blog.title,
        subtitle: blog.subtitle,
        content: blog.content,
        author_name: blog.authorName,
        author_avatar_url: blog.authorAvatarUrl,
        read_time: blog.readTime,
        published_at: blog.publishedAt,
      })
      .select(SELECT_COLUMNS)
      .single();

    if (!error) return mapRow(data as BlogPostSelectedRow);
    if (error.code !== "23505") throw error;
  }

  throw new Error("Could not generate a unique slug.");
}

export async function updateBlogPost(
  supabase: SupabaseClient<Database>,
  id: string,
  blog: Blog,
): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      category: blog.category,
      title: blog.title,
      subtitle: blog.subtitle,
      content: blog.content,
      author_name: blog.authorName,
      author_avatar_url: blog.authorAvatarUrl,
      read_time: blog.readTime,
      published_at: blog.publishedAt,
      updated_at: Temporal.Now.instant().toString(),
    })
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data as BlogPostSelectedRow) : null;
}

export async function deleteBlogPost(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data as BlogPostSelectedRow) : null;
}
