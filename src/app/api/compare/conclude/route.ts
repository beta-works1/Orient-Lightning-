import { NextResponse } from "next/server";
import { getProductByHandle } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Prefer high-throughput free models. Gemma supports json response_format
 * (avoids prompt-echo / endless reasoning from Nano).
 */
const MODELS = [
  {
    id: "google/gemma-4-31b-it:free",
    jsonMode: true,
  },
  {
    id: "openai/gpt-oss-20b:free",
    jsonMode: true,
  },
  {
    id: "nvidia/nemotron-3-nano-30b-a3b:free",
    jsonMode: false,
  },
] as const;

type Body = {
  handles?: string[];
};

type OpenRouterError = {
  message?: string;
  code?: number | string;
  metadata?: {
    raw?: string;
    provider_name?: string;
  };
};

type ConclusionPayload = {
  recommendation: string;
  bestForValue: string;
  bestForPerformance: string;
  keyDifferences: string[];
  whoShouldBuy: { product: string; buyer: string }[];
};

function productSummary(p: Product): string {
  const wattage = p.facets?.wattage?.length ? p.facets.wattage.join(", ") : "n/a";
  const colorTemp = p.facets?.colorTemp?.length ? p.facets.colorTemp.join(", ") : "n/a";
  const options = p.options?.length
    ? p.options.map((o) => `${o.name}: ${o.values.join("/")}`).join("; ")
    : "n/a";
  const compareAt =
    p.compareAtPrice != null && p.compareAtPrice > p.price
      ? formatPrice(p.compareAtPrice)
      : "n/a";

  return [
    `Title: ${p.title}`,
    `Handle: ${p.handle}`,
    `Price: ${formatPrice(p.price)}`,
    `Compare-at price: ${compareAt}`,
    `Wattage: ${wattage}`,
    `Color temperature: ${colorTemp}`,
    `Options: ${options}`,
    `SKU: ${p.sku || "n/a"}`,
    `Type: ${p.productType || "n/a"}`,
    `Vendor: ${p.vendor || "n/a"}`,
  ].join("\n");
}

function formatOpenRouterError(status: number, err?: OpenRouterError): string {
  const raw = `${err?.message || ""} ${err?.metadata?.raw || ""}`;
  if (status === 429 || /rate|limit|congest|capacity|too many/i.test(raw)) {
    return "Free model is busy (rate limited). Wait ~30s and tap Regenerate.";
  }
  if (status === 402) {
    return "OpenRouter free quota exceeded for today. Try again tomorrow or add credits.";
  }
  if (err?.message && err.message !== "Provider returned error") {
    return err.message;
  }
  return `Model unavailable right now (HTTP ${status}). Try Regenerate in a moment.`;
}

function looksLikePromptEcho(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("name the best overall pick") ||
    t.includes("which is best on price/performance") ||
    t.includes("fill the json fields") ||
    t.includes("return exactly this json") ||
    t.includes("we need to output a single json") ||
    t.includes("must fill fields with real advice")
  );
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function parseConclusion(text: string): ConclusionPayload | null {
  if (looksLikePromptEcho(text) && !extractJsonObject(text)) return null;

  const jsonText = extractJsonObject(text);
  if (!jsonText) return null;
  try {
    const parsed = JSON.parse(jsonText) as Partial<ConclusionPayload>;
    if (
      typeof parsed.recommendation !== "string" ||
      typeof parsed.bestForValue !== "string" ||
      typeof parsed.bestForPerformance !== "string" ||
      !Array.isArray(parsed.keyDifferences) ||
      !Array.isArray(parsed.whoShouldBuy)
    ) {
      return null;
    }

    const recommendation = parsed.recommendation.trim();
    const bestForValue = parsed.bestForValue.trim();
    const bestForPerformance = parsed.bestForPerformance.trim();

    if (
      recommendation.length < 20 ||
      bestForValue.length < 10 ||
      bestForPerformance.length < 10 ||
      looksLikePromptEcho([recommendation, bestForValue, bestForPerformance].join(" "))
    ) {
      return null;
    }

    return {
      recommendation,
      bestForValue,
      bestForPerformance,
      keyDifferences: parsed.keyDifferences
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 5),
      whoShouldBuy: parsed.whoShouldBuy
        .filter(
          (x): x is { product: string; buyer: string } =>
            Boolean(x) &&
            typeof x === "object" &&
            typeof (x as { product?: unknown }).product === "string" &&
            typeof (x as { buyer?: unknown }).buyer === "string",
        )
        .map((x) => ({ product: x.product.trim(), buyer: x.buyer.trim() }))
        .filter((x) => x.product && x.buyer)
        .slice(0, 4),
    };
  } catch {
    return null;
  }
}

function toMarkdown(data: ConclusionPayload): string {
  const diffs = data.keyDifferences.map((d) => `- ${d}`).join("\n");
  const buyers = data.whoShouldBuy.map((w) => `- ${w.product}: ${w.buyer}`).join("\n");
  return [
    "## Recommendation",
    data.recommendation,
    "",
    "## Best for value",
    data.bestForValue,
    "",
    "## Best for performance",
    data.bestForPerformance,
    "",
    "## Key differences",
    diffs || "- No major differences listed",
    "",
    "## Who should buy which",
    buyers || "- See recommendation above",
  ].join("\n");
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENROUTER_API_KEY is not configured. Add it to .env.local to enable AI conclusions.",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const handles = [
    ...new Set(
      (Array.isArray(body.handles) ? body.handles : [])
        .filter((h): h is string => typeof h === "string")
        .map((h) => h.trim())
        .filter(Boolean),
    ),
  ].slice(0, 4);

  if (handles.length < 2) {
    return NextResponse.json(
      { error: "At least 2 product handles are required" },
      { status: 400 },
    );
  }

  const products = handles
    .map((h) => getProductByHandle(h))
    .filter((p): p is Product => Boolean(p));

  if (products.length < 2) {
    return NextResponse.json(
      { error: "Could not resolve enough products for comparison" },
      { status: 404 },
    );
  }

  const catalogBlock = products
    .map((p, i) => `Product ${i + 1}:\n${productSummary(p)}`)
    .join("\n\n");

  const system =
    "You are a lighting product advisor for Orient Lighting (Pakistan). Reply with one JSON object only.";

  const user = `Compare these products. Write real product advice in each field.

${catalogBlock}

JSON schema:
{"recommendation":"string","bestForValue":"string","bestForPerformance":"string","keyDifferences":["string","string","string"],"whoShouldBuy":[{"product":"string","buyer":"string"}]}

Field meanings:
- recommendation: which product to buy overall and why
- bestForValue: cheapest good option and why
- bestForPerformance: strongest lighting option and why
- keyDifferences: 3 short factual differences
- whoShouldBuy: one entry per compared product

Use only given specs. Prices are PKR. Under 180 words total.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let lastStatus = 502;
  let lastError = "Model unavailable right now. Try Regenerate in a moment.";

  try {
    for (const model of MODELS) {
      const payload: Record<string, unknown> = {
        model: model.id,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        max_tokens: 800,
        include_reasoning: false,
      };

      if (model.jsonMode) {
        payload.response_format = { type: "json_object" };
      }

      // Disable chain-of-thought when supported so we don't get planning text in the UI
      payload.reasoning = { effort: "none", exclude: true };

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": siteUrl,
          "X-Title": "Orient Lighting Compare",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        error?: OpenRouterError;
        model?: string;
        choices?: { message?: { content?: string | null } }[];
      };

      if (!response.ok) {
        lastStatus = response.status;
        lastError = formatOpenRouterError(response.status, data.error);
        if (response.status === 401 || response.status === 403) {
          return NextResponse.json({ error: lastError }, { status: response.status });
        }
        continue;
      }

      const raw = data.choices?.[0]?.message?.content?.trim() || "";
      if (!raw) {
        lastError = "Empty response from model. Try Regenerate.";
        lastStatus = 502;
        continue;
      }

      const parsed = parseConclusion(raw);
      if (!parsed) {
        lastError = "Model returned an invalid answer. Try Regenerate.";
        lastStatus = 502;
        continue;
      }

      return NextResponse.json({
        conclusion: toMarkdown(parsed),
        model: data.model || model.id,
      });
    }

    return NextResponse.json({ error: lastError }, { status: lastStatus });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach OpenRouter. Please try again." },
      { status: 502 },
    );
  }
}
