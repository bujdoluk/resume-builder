
import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_SLUG_ATTEMPTS } from "@/lib/constants";
import type { Database, Tables } from "@/lib/supabase/database.types";

export type BlogCategoryKey =
  | "resumeTips"
  | "coverLetters"
  | "interviewPrep"
  | "careerAdvice"
  | "jobSearch";

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

export interface BlogPost {
  id: string;
  slug: string;
  category: BlogCategoryKey;
  title: string;
  subtitle: string;
  content: string;
  authorName: string;
  authorAvatarUrl: string | null;
  readTime: string;
  publishedAt: string;
}

const SELECT_COLUMNS =
  "id, slug, category, title, subtitle, content, author_name, author_avatar_url, read_time, published_at";

// The exact columns SELECT_COLUMNS asks for, picked from the generated Row
// type — Supabase's typed client can't reliably infer a narrowed shape from
// a hand-written column-list string, so this cast target is kept in sync
// with the real table schema explicitly instead.
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

// `category` is a plain text column with a Postgres CHECK constraint (see
// supabase/migrations/0006_create_blog_posts.sql) — same caveat as `plan` in
// subscriptions.ts: the generated type is `string`, narrowed here.
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

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "post";
}

export interface NewBlogPostInput {
  category: BlogCategoryKey;
  title: string;
  subtitle: string;
  content: string;
  authorName: string;
  authorAvatarUrl: string | null;
  readTime: string;
  publishedAt: string;
}

export async function createBlogPost(
  supabase: SupabaseClient<Database>,
  input: NewBlogPostInput,
): Promise<BlogPost> {
  const base = slugify(input.title);

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        slug,
        category: input.category,
        title: input.title,
        subtitle: input.subtitle,
        content: input.content,
        author_name: input.authorName,
        author_avatar_url: input.authorAvatarUrl,
        read_time: input.readTime,
        published_at: input.publishedAt,
      })
      .select(SELECT_COLUMNS)
      .single();

    if (!error) return mapRow(data as BlogPostSelectedRow);
    if (error.code !== "23505") throw error;
  }

  throw new Error("Could not generate a unique slug.");
}

// Returns the deleted row (or null if nothing matched that id — already
// deleted, or a bad id) so callers can use its slug/title without a
// separate fetch, e.g. for an audit log entry.
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
