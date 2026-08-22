import { NextResponse } from "next/server";
import { getProductByHandle } from "@/lib/catalog";
import { buildCompareSummaryPrompt } from "@/lib/compare/prompt";
import {
  clientIp,
  generateWithModelFallback,
  geminiErrorResponse,
  rateLimited,
} from "@/lib/chat/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PRODUCTS = 4;

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

    const prompt = buildCompareSummaryPrompt(products);
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
