import type { MetadataRoute } from "next";
import {
  getAllCollections,
  getAllProducts,
  getBlogPosts,
  getPage,
} from "@/lib/catalog";
import { SITE_URL } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATIC_PAGE_HANDLES = [
  "become-our-partner",
  "terms-services",
  "privacy-policy",
  "return-exchange",
  "warranty-claim",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;
  const now = new Date();
  const [cols, prods, posts] = await Promise.all([
    getAllCollections(),
    getAllProducts(),
    getBlogPosts(),
  ]);

  const pageEntries = (
    await Promise.all(STATIC_PAGE_HANDLES.map(async (h) => getPage(h)))
  )
    .filter(Boolean)
    .map((p) => ({
      url: `${base}/pages/${p!.handle}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.4,
    }));

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/stores`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    {
      url: `${base}/blogs/orient-lighting`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...cols.map((c) => ({
      url: `${base}/collections/${c.handle}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...prods.map((p) => ({
      url: `${base}/products/${p.handle}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...posts.map((p) => ({
      url: `${base}/blogs/orient-lighting/${p.handle}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...pageEntries,
  ];
}
