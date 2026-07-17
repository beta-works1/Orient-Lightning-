import type { MetadataRoute } from "next";
import {
  getAllCollections,
  getAllProducts,
  getBlogPosts,
  getCatalog,
} from "@/lib/catalog";
import { SITE_URL } from "@/lib/types";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const pages = getCatalog().pages;
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/blogs/orient-lighting`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...getAllCollections().map((c) => ({
      url: `${base}/collections/${c.handle}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...getAllProducts().map((p) => ({
      url: `${base}/products/${p.handle}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...getBlogPosts().map((p) => ({
      url: `${base}/blogs/orient-lighting/${p.handle}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...pages.map((p) => ({
      url: `${base}/pages/${p.handle}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
  ];
}
