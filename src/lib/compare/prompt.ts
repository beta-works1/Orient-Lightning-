import { SITE, WHATSAPP_URL } from "../types";
import {
  buildCompareSpecSlice,
  formatCompareSpecBlock,
  type CompareProductLike,
  type CompareSpecSlice,
} from "./specSlice";

/**
 * Shared instructions for every AI comparison surface (compare page, chat).
 * Contrastive, spec-cited, no hallucination.
 */
export const COMPARE_SUMMARY_RULES = [
  "Write a contrastive comparison of the selected Orient LED products. Lead with how they differ, not what they share.",
  "Use ONLY the spec fields below. Never invent housing, lumens, lm/W, power factor, IP, CRI, beam, voltage, lifetime, IK, driver, or any other number.",
  'If a field is "not listed" for a product, say that spec is not listed — do not guess or copy it from the other product.',
  "Do not mention a spec that is identical across all selected products unless it is a shared constraint the buyer must know (for example all are IP20 indoor-only).",
  "Lead with differences. Cite actual values (e.g. PF 0.9 vs PF 0.5, die-cast aluminium vs polycarbonate, 14,000 lm vs 1,140 lm).",
  "Cover, when data exists: housing material, luminous output (lm and lm/W), power factor, application / intended use, plus wattage, CCT, IP, CRI, beam, voltage, lifetime, mounting, IK, and driver.",
  "Structure: one short overview sentence, then 4–8 bullet lines. Each bullet names one dimension and contrasts the products by name with values.",
  "For 3+ products, do N-way contrasts (A vs B vs C) on each dimension — not a separate paragraph per product.",
  "No shared marketing adjectives. Friendly English. No fluff, no hype.",
].join("\n- ");

export function compareSummaryRulesBlock(): string {
  return `Rules:\n- ${COMPARE_SUMMARY_RULES}`;
}

export function slicesForProducts(
  products: CompareProductLike[],
  catalogues?: Array<Parameters<typeof buildCompareSpecSlice>[1]>,
): CompareSpecSlice[] {
  return products.map((product, i) =>
    buildCompareSpecSlice(product, catalogues ? catalogues[i] : undefined),
  );
}

export function formatCompareSpecAppendix(slices: CompareSpecSlice[]): string {
  return [
    "Selected products (full spec slice — cite these values; do not invent):",
    ...slices.map((slice, i) => `\n--- Product ${i + 1}: ${slice.title} ---\n${formatCompareSpecBlock(slice)}`),
  ].join("\n");
}

export function buildCompareSummaryPrompt(
  products: CompareProductLike[],
  catalogues?: Array<Parameters<typeof buildCompareSpecSlice>[1]>,
): string {
  const slices = slicesForProducts(products, catalogues);
  return [
    `You are the ${SITE.name} product advisor (${SITE.legalName}, Pakistan).`,
    "Shoppers are looking at these Orient LED products side by side.",
    "",
    compareSummaryRulesBlock(),
    `- Link each product once as markdown: [Product Title](/products/handle)`,
    `- For quotes or help, mention WhatsApp ${SITE.phoneDisplay} as [${SITE.phoneDisplay}](${WHATSAPP_URL}).`,
    "",
    formatCompareSpecAppendix(slices),
    "",
    "Summary:",
  ].join("\n");
}

export function looksLikeCompareQuestion(text: string): boolean {
  return /\b(compar(?:e|ing|ison)|vs\.?|versus|differ(?:ence|s)?|which (?:one|light)|better (?:for|choice)|side[- ]by[- ]side)\b/i.test(
    text,
  );
}

export function findMentionedProducts<T extends CompareProductLike>(
  text: string,
  products: T[],
  limit = 4,
): T[] {
  const lower = text.toLowerCase();
  const hits: T[] = [];
  const seen = new Set<string>();
  for (const product of products) {
    const handle = product.handle.toLowerCase();
    const title = product.title.toLowerCase();
    const matched =
      (handle.length >= 4 && lower.includes(handle)) ||
      (title.length >= 12 && lower.includes(title));
    if (!matched || seen.has(product.handle)) continue;
    seen.add(product.handle);
    hits.push(product);
    if (hits.length >= limit) break;
  }
  return hits;
}
