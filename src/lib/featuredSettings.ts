import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export type FeaturedSetting = {
  handles: string[];
  title: string;
  viewAllHref: string;
};

export const DEFAULT_FEATURED: FeaturedSetting = {
  handles: [],
  title: "Featured this week",
  viewAllHref: "/collections/best-sellers",
};

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase public env");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseValue(raw: unknown): FeaturedSetting {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_FEATURED };
  const v = raw as Record<string, unknown>;
  const handles = Array.isArray(v.handles)
    ? v.handles.filter((h): h is string => typeof h === "string" && h.trim().length > 0)
    : [];
  return {
    handles,
    title:
      typeof v.title === "string" && v.title.trim()
        ? v.title.trim()
        : DEFAULT_FEATURED.title,
    viewAllHref:
      typeof v.viewAllHref === "string" && v.viewAllHref.trim()
        ? v.viewAllHref.trim()
        : DEFAULT_FEATURED.viewAllHref,
  };
}

async function fetchFeaturedSetting(): Promise<FeaturedSetting> {
  try {
    const sb = publicClient();
    const { data, error } = await sb
      .from("site_settings")
      .select("value")
      .eq("key", "featured_week")
      .maybeSingle();
    if (error || !data) return { ...DEFAULT_FEATURED };
    return parseValue(data.value);
  } catch {
    return { ...DEFAULT_FEATURED };
  }
}

export async function getFeaturedSettingFresh(): Promise<FeaturedSetting> {
  return fetchFeaturedSetting();
}

export const getFeaturedSetting = unstable_cache(
  fetchFeaturedSetting,
  ["site-featured-week-v1"],
  { revalidate: 60, tags: ["featured"] },
);
