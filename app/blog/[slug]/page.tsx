/**
 * `/blog/[slug]` route: full article view, linked from the cards on
 * `/blog`. Posts are stored in the `blog_posts` table — no static params,
 * fully dynamic (the request-scoped Supabase client already forces this
 * via `cookies()`), so newly admin-created posts are available immediately.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import BlogPostContent from "@/components/BlogPostContent";
import { createClient } from "@/lib/supabase/server";
import { getBlogPostBySlug } from "@/lib/supabase/blogPosts";

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = await createClient();
  const post = await getBlogPostBySlug(supabase, slug);
  if (!post) return {};

  const title = `${post.title} — QuickResumeBuilder.online`;
  const description = post.subtitle;

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/blog/${slug}`,
      siteName: "QuickResumeBuilder.online",
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function Page(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const supabase = await createClient();
  const post = await getBlogPostBySlug(supabase, slug);
  if (!post) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <BlogPostContent post={post} />
      <Footer />
    </div>
  );
}
