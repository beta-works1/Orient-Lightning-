import { NextResponse } from "next/server";
import { getProductByHandle } from "@/lib/catalog";
import {
  clientIp,
  generateWithModelFallback,
  geminiErrorResponse,
  rateLimited,
} from "@/lib/chat/gemini";
import { formatPrice } from "@/lib/format";
import { SITE, WHATSAPP_URL } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PRODUCTS = 4;

function productBlock(p: NonNullable<Awaited<ReturnType<typeof getProductByHandle>>>): string {
  const watts = p.facets?.wattage?.length ? p.facets.wattage.join(", ") : "n/a";
  const cct = p.facets?.colorTemp?.length ? p.facets.colorTemp.join(", ") : "n/a";
  const options = p.options?.length
    ? p.options.map((o) => `${o.name}: ${o.values.join(", ")}`).join(" · ")
    : "n/a";
  return [
    `Title: ${p.title}`,
    `Handle: ${p.handle}`,
    `URL: /products/${p.handle}`,
    `Price: ${formatPrice(p.price)}`,
    `Type: ${p.productType || "n/a"}`,
    `Wattage: ${watts}`,
    `Color temp: ${cct}`,
    `Options: ${options}`,
    `SKU: ${p.sku || "n/a"}`,
  ].join("\n");
}

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      {
        error:
          "AI summary is not configured yet. Add GEMINI_API_KEY to .env.local.",
      },
      { status: 503 },
    );
  }

  if (rateLimited(`compare:${clientIp(request)}`, 60_000, 12)) {
    return NextResponse.json(
      { error: "Too many summary requests. Please wait a minute." },
      { status: 429 },
    );
  }

  let body: { handles?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const rawHandles = Array.isArray(body.handles) ? body.handles : [];
  const handles = [
    ...new Set(
      rawHandles
        .filter((h): h is string => typeof h === "string")
        .map((h) => h.trim())
        .filter(Boolean),
    ),
  ].slice(0, MAX_PRODUCTS);

  if (handles.length < 2) {
    return NextResponse.json(
      { error: "Select at least two products to summarize." },
      { status: 400 },
    );
  }

  try {
    const products = (
      await Promise.all(handles.map((h) => getProductByHandle(h)))
    ).filter((p): p is NonNullable<typeof p> => Boolean(p));

    if (products.length < 2) {
      return NextResponse.json(
        { error: "Could not load enough products for a summary." },
        { status: 404 },
      );
    }

    const prompt = [
      `You are the ${SITE.name} product advisor (${SITE.legalName}, Pakistan).`,
      "Write a short comparison summary for shoppers looking at these Orient LED products side by side.",
      "",
      "Rules:",
      "- Use ONLY the product facts below. Do not invent wattage, prices, or features.",
      "- 3–5 short sentences OR up to 4 bullet lines.",
      "- Call out the main differences (price, wattage, color temp, type, best use).",
      "- Say which product fits which space when clear (e.g. high bay vs batten).",
      `- Link each product once as markdown: [Product Title](/products/handle)`,
      `- For quotes or help, mention WhatsApp ${SITE.phoneDisplay} as [${SITE.phoneDisplay}](${WHATSAPP_URL}).`,
      "- Friendly English. No fluff, no hype.",
      "",
      "Products:",
      ...products.map((p, i) => `\n--- Product ${i + 1} ---\n${productBlock(p)}`),
      "",
      "Summary:",
    ].join("\n");

    const summary = await generateWithModelFallback(key, prompt, "[api/compare/summary]");
    return NextResponse.json({
      summary,
      handles: products.map((p) => p.handle),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Summary failed";
    console.error("[api/compare/summary]", message);
    const { error, status } = geminiErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
