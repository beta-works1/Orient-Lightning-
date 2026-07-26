import { NextResponse } from "next/server";
import { buildProductContext, buildSystemPrompt } from "@/lib/chat/productContext";
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

  let body: { messages?: ChatMessage[] };
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

  try {
    const catalog = await buildProductContext();
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
