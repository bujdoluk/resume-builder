
import type { Metadata } from "next";
import Footer from "@/components/landing-page/Footer";
import BlogPageContent from "@/components/blog/BlogPageContent";
import { getCachedBlogPosts } from "@/lib/supabase/blogPosts";

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
  const posts = await getCachedBlogPosts();

  return (
    <div className="flex min-h-full flex-col">
      <BlogPageContent posts={posts} />
      <Footer />
    </div>
  );
}
