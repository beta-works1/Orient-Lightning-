import { getAllProducts } from "../catalog";
import {
  compareSummaryRulesBlock,
  findMentionedProducts,
  formatCompareSpecAppendix,
  looksLikeCompareQuestion,
  slicesForProducts,
} from "../compare/prompt";
import { buildCompareSpecSlice, formatCompareDigestLine } from "../compare/specSlice";
import type { CompareProductLike } from "../compare/specSlice";
import { SITE, WHATSAPP_URL, type Product } from "../types";

const COMPARE_CHAT_RULES = `${compareSummaryRulesBlock()}
- Prefer linking products as /products/{handle} paths.
- If the shopper has products selected for comparison, use the full spec slice appendix when present.`;

/** Compact catalogue digest for Gemini system context (published products only). */
export async function buildProductContext(limit = 40): Promise<{
  catalog: string;
  products: Product[];
}> {
  const products = await getAllProducts();
  const lines = products.slice(0, limit).map((p) =>
    formatCompareDigestLine(buildCompareSpecSlice(p)),
  );

  const catalog = [
    `Company: ${SITE.name} (${SITE.legalName})`,
    `Phone/WhatsApp: ${SITE.phoneDisplay} → ${WHATSAPP_URL}`,
    `Email: ${SITE.emailSales} / ${SITE.emailCare}`,
    `Hours: ${SITE.hours}`,
    `Address: ${SITE.address}`,
    `Free shipping note: ${SITE.announcement}`,
    `Catalogue PDF: ${SITE.catalogueUrl}`,
    "",
    "Published products (use these for recommendations; do not invent prices or specs):",
    ...lines,
  ].join("\n");

  return { catalog, products };
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
- Keep answers concise (2–6 short sentences) unless the user asks for detail or a comparison.

When the user compares two or more lights, or asks which to pick:
${COMPARE_CHAT_RULES}

Catalogue context:
${catalog}`;
}

export function buildChatCompareAppendix(
  allProducts: CompareProductLike[],
  userText: string,
  compareHandles: string[] = [],
): string {
  const fromBar = compareHandles
    .map((handle) => allProducts.find((p) => p.handle === handle))
    .filter((p): p is CompareProductLike => Boolean(p));
  const mentioned = findMentionedProducts(userText, allProducts);
  const seen = new Set<string>();
  const focus: CompareProductLike[] = [];
  for (const product of [...fromBar, ...mentioned]) {
    if (seen.has(product.handle)) continue;
    seen.add(product.handle);
    focus.push(product);
    if (focus.length >= 4) break;
  }

  const compareIntent = looksLikeCompareQuestion(userText) || fromBar.length >= 2;
  if (focus.length < 2 && !compareIntent) return "";
  if (focus.length === 0) return "";

  const slices = slicesForProducts(focus);
  const header =
    focus.length >= 2
      ? compareSummaryRulesBlock()
      : "Use only the spec fields below for this product. Never invent missing values.";

  return ["", header, "", formatCompareSpecAppendix(slices)].join("\n");
}
