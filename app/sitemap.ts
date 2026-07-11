import type { MetadataRoute } from "next";
import { Temporal } from "temporal-polyfill";

const baseUrl = "https://www.lukasbujdos.com";
const lastModified = Temporal.Now.instant().toString();

export default function sitemap(): MetadataRoute.Sitemap {
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
  ];
}
