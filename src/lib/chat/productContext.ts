import { getAllProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { SITE, WHATSAPP_URL } from "@/lib/types";

/** Compact catalogue digest for Gemini system context (published products only). */
export async function buildProductContext(limit = 40): Promise<string> {
  const products = await getAllProducts();
  const lines = products.slice(0, limit).map((p) => {
    const watts = p.facets?.wattage?.join("/") || "";
    const cct = p.facets?.colorTemp?.join("/") || "";
    const type = p.productType || "";
    const parts = [
      `- ${p.title}`,
      `handle:${p.handle}`,
      `price:${formatPrice(p.price)}`,
      type ? `type:${type}` : "",
      watts ? `wattage:${watts}` : "",
      cct ? `cct:${cct}` : "",
      `url:/products/${p.handle}`,
    ].filter(Boolean);
    return parts.join(" | ");
  });

  return [
    `Company: ${SITE.name} (${SITE.legalName})`,
    `Phone/WhatsApp: ${SITE.phoneDisplay} → ${WHATSAPP_URL}`,
    `Email: ${SITE.emailSales} / ${SITE.emailCare}`,
    `Hours: ${SITE.hours}`,
    `Address: ${SITE.address}`,
    `Free shipping note: ${SITE.announcement}`,
    `Catalogue PDF: ${SITE.catalogueUrl}`,
    "",
    "Published products (use these for recommendations; do not invent prices):",
    ...lines,
  ].join("\n");
}

export function buildSystemPrompt(catalog: string): string {
  return `You are the Orient Lighting assistant on the Orient Lighting website (Pakistan).
Help customers choose LED lights (residential, commercial, industrial), explain wattage and color temperature, and point them to the right product pages.

Rules:
- Answer in clear, friendly English (short Urdu is OK if the user writes in Urdu).
- Only use product names, prices, and specs from the catalogue context below. If unsure, say so.
- Prefer linking products as /products/{handle} paths.
- For quotes, bulk orders, dealer visits, or warranty claims, suggest WhatsApp ${SITE.phoneDisplay}.
- Never invent stock levels, discounts, or products not listed.
- Keep answers concise (2–6 short sentences) unless the user asks for detail.

Catalogue context:
${catalog}`;
}
