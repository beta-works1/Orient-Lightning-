import { NextResponse } from "next/server";
import {
  buildChatCompareAppendix,
  buildProductContext,
  buildSystemPrompt,
} from "@/lib/chat/productContext";
import {
  clientIp,
  generateWithModelFallback,
  geminiErrorResponse,
  rateLimited,
} from "@/lib/chat/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_MESSAGE = 1000;
const MAX_HISTORY = 12;
const MAX_COMPARE = 4;

function parseCompareHandles(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .filter((h): h is string => typeof h === "string")
        .map((h) => h.trim())
        .filter(Boolean),
    ),
  ].slice(0, MAX_COMPARE);
}

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      {
        error:
          "Chat is not configured yet. Add GEMINI_API_KEY to .env.local (free key from Google AI Studio).",
      },
      { status: 503 },
    );
  }

  if (rateLimited(`chat:${clientIp(request)}`)) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  let body: { messages?: ChatMessage[]; compareHandles?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-MAX_HISTORY) : [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) {
    return NextResponse.json({ error: "Please type a message." }, { status: 400 });
  }
  if (lastUser.content.length > MAX_MESSAGE) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const compareHandles = parseCompareHandles(body.compareHandles);

  try {
    const { catalog, products } = await buildProductContext();
    const appendix = buildChatCompareAppendix(products, lastUser.content.trim(), compareHandles);
    const system = buildSystemPrompt(catalog);

    const historyText = messages
      .slice(0, -1)
      .map(
        (m) =>
          `${m.role === "assistant" ? "Assistant" : "User"}: ${String(m.content).slice(0, MAX_MESSAGE)}`,
      )
      .join("\n");

    const prompt = [
      system,
      appendix,
      historyText ? `\nConversation so far:\n${historyText}` : "",
      `\nUser: ${lastUser.content.trim()}`,
      "\nAssistant:",
    ]
      .filter(Boolean)
      .join("\n");

    const text = await generateWithModelFallback(key, prompt, "[api/chat]");
    return NextResponse.json({ reply: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    console.error("[api/chat]", message);
    const { error, status } = geminiErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
