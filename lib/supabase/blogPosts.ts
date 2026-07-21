
import type { SupabaseClient } from "@supabase/supabase-js";

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

interface BlogPostTableRow {
  id: string;
  slug: string;
  category: BlogCategoryKey;
  title: string;
  subtitle: string;
  content: string;
  author_name: string;
  author_avatar_url: string | null;
  read_time: string;
  published_at: string;
}

const SELECT_COLUMNS =
  "id, slug, category, title, subtitle, content, author_name, author_avatar_url, read_time, published_at";

function mapRow(row: BlogPostTableRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    title: row.title,
    subtitle: row.subtitle,
    content: row.content,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url,
    readTime: row.read_time,
    publishedAt: row.published_at,
  };
}

export async function getBlogPosts(supabase: SupabaseClient): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(SELECT_COLUMNS)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data as BlogPostTableRow[]).map(mapRow);
}

export async function getBlogPostBySlug(supabase: SupabaseClient, slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(SELECT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data as BlogPostTableRow) : null;
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

const MAX_SLUG_ATTEMPTS = 20;

export async function createBlogPost(
  supabase: SupabaseClient,
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

    if (!error) return mapRow(data as BlogPostTableRow);
    if (error.code !== "23505") throw error;
  }

  throw new Error("Could not generate a unique slug.");
}
