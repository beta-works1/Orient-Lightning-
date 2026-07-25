import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { SITE } from "@/lib/types";
import { createServiceClient } from "@/lib/supabase/admin";

export type CatalogueSetting = {
  enabled: boolean;
  url: string | null;
  filename: string;
  storagePath: string | null;
};

const DEFAULT_CATALOGUE: CatalogueSetting = {
  enabled: true,
  url: SITE.catalogueUrl,
  filename: SITE.catalogueFilename,
  storagePath: null,
};

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase public env");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseValue(raw: unknown): CatalogueSetting {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_CATALOGUE };
  const v = raw as Record<string, unknown>;
  return {
    enabled: v.enabled !== false,
    url: typeof v.url === "string" && v.url ? v.url : null,
    filename:
      typeof v.filename === "string" && v.filename
        ? v.filename
        : SITE.catalogueFilename,
    storagePath: typeof v.storagePath === "string" ? v.storagePath : null,
  };
}

async function fetchCatalogueSetting(): Promise<CatalogueSetting> {
  try {
    const sb = publicClient();
    const { data, error } = await sb
      .from("site_settings")
      .select("value")
      .eq("key", "catalogue")
      .maybeSingle();
    if (error || !data) return { ...DEFAULT_CATALOGUE };
    return parseValue(data.value);
  } catch {
    return { ...DEFAULT_CATALOGUE };
  }
}

export const getCatalogueSetting = unstable_cache(
  fetchCatalogueSetting,
  ["site-catalogue-v1"],
  { revalidate: 60, tags: ["catalogue"] },
);

/** Public download target — null when admin disabled / removed the catalogue. */
export async function getCatalogueDownload(): Promise<{
  url: string;
  filename: string;
} | null> {
  const setting = await getCatalogueSetting();
  if (!setting.enabled || !setting.url) return null;
  return { url: setting.url, filename: setting.filename };
}

export async function saveCatalogueSetting(value: CatalogueSetting) {
  const sb = createServiceClient();
  const { error } = await sb.from("site_settings").upsert({
    key: "catalogue",
    value,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}
