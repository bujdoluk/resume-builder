/**
 * `/blog` route: public blog index, linked from the navbar. Posts are
 * fetched from the `blog_posts` table (admin-authored via the "Add Blog"
 * form on the client, see components/AddBlogPostDialog.tsx).
 */
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import BlogPageContent from "@/components/BlogPageContent";
import { createClient } from "@/lib/supabase/server";
import { getBlogPosts } from "@/lib/supabase/blogPosts";

const title = "Blog — QuickResumeBuilder.online";
const description = "Resume tips, job search advice, and career guides.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title,
    description,
    url: "/blog",
    siteName: "QuickResumeBuilder.online",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default async function Page() {
  const supabase = await createClient();
  const posts = await getBlogPosts(supabase);

  return (
    <div className="flex min-h-full flex-col">
      <BlogPageContent posts={posts} />
      <Footer />
    </div>
  );
}
