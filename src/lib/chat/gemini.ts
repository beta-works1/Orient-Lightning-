const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimited(
  key: string,
  windowMs = 60_000,
  maxPerWindow = 20,
): boolean {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || now > row.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  row.count += 1;
  return row.count > maxPerWindow;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

export function pickModels(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const defaults = [
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
    "gemini-flash-latest",
    "gemini-3.6-flash",
  ];
  if (preferred) return [preferred, ...defaults.filter((m) => m !== preferred)];
  return defaults;
}

function thinkingConfigFor(model: string): Record<string, unknown> {
  if (/^gemini-3/i.test(model)) {
    return { thinkingConfig: { thinkingLevel: "minimal" } };
  }
  return { thinkingConfig: { thinkingBudget: 0 } };
}

export async function generateWithGemini(
  apiKey: string,
  model: string,
  prompt: string,
  maxOutputTokens = 2048,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  async function call(withThinking: boolean): Promise<string> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens,
          ...(withThinking ? thinkingConfigFor(model) : {}),
        },
      }),
    });

    const raw = await res.text();
    let data: {
      error?: { message?: string };
      candidates?: {
        finishReason?: string;
        content?: { parts?: { text?: string; thought?: boolean }[] };
      }[];
    };
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`Gemini returned non-JSON (${res.status})`);
    }

    if (!res.ok) {
      throw new Error(data.error?.message || `Gemini HTTP ${res.status}`);
    }

    const candidate = data.candidates?.[0];
    const text =
      candidate?.content?.parts
        ?.filter((p) => !p.thought)
        ?.map((p) => p.text || "")
        .join("")
        .trim() || "";
    if (!text) {
      throw new Error(
        candidate?.finishReason
          ? `Empty Gemini response (${candidate.finishReason})`
          : "Empty Gemini response",
      );
    }
    if (candidate?.finishReason === "MAX_TOKENS") {
      console.warn(`[gemini] truncated by MAX_TOKENS model=${model}`);
    }
    return text;
  }

  try {
    return await call(true);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/thinking|INVALID_ARGUMENT/i.test(msg)) {
      console.warn(`[gemini] retry without thinkingConfig model=${model}`);
      return await call(false);
    }
    throw err;
  }
}

export async function generateWithModelFallback(
  apiKey: string,
  prompt: string,
  logPrefix = "[gemini]",
): Promise<string> {
  let lastError: unknown;
  for (const model of pickModels()) {
    try {
      const text = await generateWithGemini(apiKey, model, prompt);
      console.info(`${logPrefix} ok model=${model}`);
      return text;
    } catch (err) {
      lastError = err;
      console.warn(`${logPrefix} model failed: ${model}`, err);
    }
  }
  throw lastError || new Error("All Gemini models failed");
}

export function geminiErrorResponse(err: unknown): { error: string; status: number } {
  const message = err instanceof Error ? err.message : "Request failed";
  if (/quota|rate|RESOURCE_EXHAUSTED/i.test(message)) {
    return {
      error: "Free Gemini quota hit. Wait a minute and try again.",
      status: 429,
    };
  }
  if (/401|UNAUTHENTICATED|ACCESS_TOKEN_TYPE|API key/i.test(message)) {
    return {
      error: "Gemini rejected this API key. Create a new key in Google AI Studio.",
      status: 401,
    };
  }
  return { error: "Assistant unavailable right now. Please try again.", status: 502 };
}
