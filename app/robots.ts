import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/my-resumes",
    },
    sitemap: "https://www.lukasbujdos.com/sitemap.xml",
  };
}
