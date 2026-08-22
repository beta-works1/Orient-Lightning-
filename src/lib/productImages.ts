/** URLs the storefront/CSP can actually render as product photos. */

function hostAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host.endsWith(".supabase.co") ||
    host === "cdn.shopify.com" ||
    host === "orientlighting.com.pk" ||
    host.endsWith(".orientlighting.com.pk")
  );
}

export function usableProductImageUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const src = raw.trim();
  if (!src) return null;
  const lower = src.toLowerCase();
  if (
    lower.startsWith("blob:") ||
    lower.startsWith("file:") ||
    lower.startsWith("javascript:") ||
    lower.startsWith("data:")
  ) {
    return null;
  }
  if (src.startsWith("/") && !src.startsWith("//")) return src;

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!hostAllowed(url.hostname)) return null;
  return src;
}

export function usableProductImageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of images) {
    const src = usableProductImageUrl(item);
    if (!src || seen.has(src)) continue;
    seen.add(src);
    out.push(src);
  }
  return out;
}

export function isRemoteImageUrl(src: string): boolean {
  return /^https?:\/\//i.test(src);
}
