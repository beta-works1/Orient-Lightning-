"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatRichText } from "@/components/chat/ChatRichText";

type Props = {
  handles: string[];
};

export function CompareAiSummary({ handles }: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handlesKey = handles.join(",");
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    const list = handlesKey.split(",").filter(Boolean);
    if (list.length < 2) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/compare/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handles: list }),
        signal: ac.signal,
      });
      const data = (await res.json()) as { summary?: string; error?: string };
      if (!res.ok || !data.summary) {
        setSummary(null);
        setError(data.error || "Could not generate a summary.");
        return;
      }
      setSummary(data.summary);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setSummary(null);
      setError("Network error. Try again.");
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [handlesKey]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  if (handlesKey.split(",").filter(Boolean).length < 2) return null;

  return (
    <section
      className="mb-6 border border-brand-border bg-white"
      aria-labelledby="compare-ai-summary-heading"
      aria-busy={loading}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border bg-slate-50 px-4 py-3">
        <div>
          <p
            id="compare-ai-summary-heading"
            className="text-xs font-semibold uppercase tracking-wide text-brand-muted"
          >
            AI summary
          </p>
          <p className="mt-0.5 text-sm text-brand-dark">
            Orient Assistant compares the specs you selected
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="min-h-[40px] rounded-md border border-brand-border bg-white px-3 text-sm font-semibold text-brand-dark hover:border-brand hover:text-brand disabled:opacity-50"
        >
          {loading ? "Summarizing…" : "Refresh"}
        </button>
      </div>

      <div className="px-4 py-4 text-sm leading-relaxed text-brand-dark">
        {loading && !summary ? (
          <p className="text-brand-muted">Reading specs and writing a short take…</p>
        ) : null}
        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        ) : null}
        {summary ? (
          <div className={loading ? "opacity-60" : undefined}>
            <ChatRichText text={summary} />
          </div>
        ) : null}
        {!loading && !error && !summary ? (
          <p className="text-brand-muted">No summary yet.</p>
        ) : null}
      </div>
    </section>
  );
}
