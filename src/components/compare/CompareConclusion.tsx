"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/types";

function renderLiteMarkdown(text: string) {
  const blocks = text.trim().split(/\n{2,}/);
  return blocks.map((block, i) => {
    const lines = block.split("\n");
    if (lines[0]?.startsWith("## ")) {
      const title = lines[0].replace(/^##\s+/, "");
      const rest = lines.slice(1);
      const listItems = rest.filter((l) => /^[-*]\s+/.test(l));
      const paragraphs = rest.filter((l) => l && !/^[-*]\s+/.test(l));
      return (
        <div key={i} className="space-y-2">
          <h3 className="font-display text-lg text-brand-navy">{title}</h3>
          {paragraphs.map((p, j) => (
            <p key={j} className="text-sm leading-relaxed text-brand-dark">
              {p}
            </p>
          ))}
          {listItems.length ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-brand-dark">
              {listItems.map((l, j) => (
                <li key={j}>{l.replace(/^[-*]\s+/, "")}</li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    }

    if (lines.every((l) => /^[-*]\s+/.test(l) || !l.trim())) {
      return (
        <ul key={i} className="list-disc space-y-1 pl-5 text-sm text-brand-dark">
          {lines
            .filter((l) => l.trim())
            .map((l, j) => (
              <li key={j}>{l.replace(/^[-*]\s+/, "")}</li>
            ))}
        </ul>
      );
    }

    return (
      <p key={i} className="text-sm leading-relaxed text-brand-dark">
        {block}
      </p>
    );
  });
}

export function CompareConclusion({ products }: { products: Product[] }) {
  const [conclusion, setConclusion] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlesKey = products.map((p) => p.handle).join(",");

  const generate = useCallback(async () => {
    if (products.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/compare/conclude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handles: products.map((p) => p.handle) }),
      });
      const data = (await res.json()) as {
        conclusion?: string;
        model?: string;
        error?: string;
      };
      if (!res.ok) {
        setConclusion(null);
        setModel(null);
        setError(data.error || "Could not generate conclusion");
        return;
      }
      setConclusion(data.conclusion || null);
      setModel(data.model || "openrouter/free");
    } catch {
      setError("Network error while generating conclusion");
      setConclusion(null);
      setModel(null);
    } finally {
      setLoading(false);
    }
  }, [products]);

  useEffect(() => {
    setConclusion(null);
    setModel(null);
    setError(null);
    void generate();
  }, [handlesKey]); // eslint-disable-line react-hooks/exhaustive-deps -- regenerate only when product set changes

  if (products.length < 2) return null;

  return (
    <section className="mt-8 rounded-lg border border-brand-border bg-gradient-to-br from-slate-50 to-white p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-brand-navy">AI conclusion</h2>
          <p className="mt-1 text-xs text-brand-muted">
            Powered by OpenRouter
            {model ? ` · ${model}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading}
          className="rounded-md border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-navy hover:border-brand hover:text-brand disabled:opacity-50"
        >
          {loading ? "Generating…" : "Regenerate"}
        </button>
      </div>

      {loading && !conclusion ? (
        <div className="space-y-2 py-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
          <p className="pt-2 text-sm text-brand-muted">Comparing specs and drafting a recommendation…</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-brand-dark">
          {error}
        </div>
      ) : null}

      {conclusion ? (
        <div className={`space-y-4 ${loading ? "opacity-60" : ""}`}>
          {renderLiteMarkdown(conclusion)}
        </div>
      ) : null}
    </section>
  );
}
