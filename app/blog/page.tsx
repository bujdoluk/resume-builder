/**
 * `/blog` route: public placeholder page for the future blog — no posts
 * yet, just a "coming soon" notice, linked from the navbar.
 */
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import BlogPageContent from "@/components/BlogPageContent";

const title = "Blog — QuickResumeBuilder.com";
const description = "Resume tips, job search advice, and career guides — coming soon.";

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
    siteName: "QuickResumeBuilder.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function Page() {
  return (
    <div className="flex min-h-full flex-col">
      <BlogPageContent />
      <Footer />
    </div>
  );
}
