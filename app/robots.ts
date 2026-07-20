/**
 * Generates `/robots.txt`: allows crawling of the whole site except the
 * user-specific `/my-resumes` page, and points crawlers at the sitemap.
 */
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/my-resumes",
    },
    sitemap: "https://www.quickresumebuilder.online/sitemap.xml",
  };
}
