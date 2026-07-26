"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { ChatRichText } from "@/components/chat/ChatRichText";
import { useCompare } from "@/components/compare/CompareProvider";
import { WHATSAPP_URL } from "@/lib/types";

type Msg = { role: "user" | "assistant"; content: string };

const STARTER: Msg = {
  role: "assistant",
  content:
    "Hi — I’m the Orient Lighting assistant. Ask about bulbs, panels, street lights, wattage, or color temperature. For quotes, tap WhatsApp anytime.",
};

export function ChatBot() {
  const pathname = usePathname();
  const { items, ready } = useCompare();
  const clearCompareBar = ready && items.length > 0 && pathname !== "/compare";
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([STARTER]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, pending]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;

    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: data.reply! }]);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className={`fixed right-4 z-50 flex flex-col items-end gap-3 sm:right-6 ${
        clearCompareBar
          ? "bottom-40 sm:bottom-44"
          : "bottom-24 sm:bottom-28"
      }`}
    >
      {open ? (
        <div
          className="flex h-[min(520px,70vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-2xl shadow-black/20"
          role="dialog"
          aria-label="Orient Lighting chat"
        >
          <div className="flex items-center justify-between bg-brand px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Orient Assistant</p>
              <p className="text-[11px] text-white/80">Powered by Gemini · Product help</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-sm hover:bg-white/15"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-3">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-md bg-brand px-3 py-2 text-sm text-white whitespace-pre-wrap"
                      : "max-w-[85%] rounded-2xl rounded-bl-md border border-brand-border bg-white px-3 py-2 text-sm text-brand-dark"
                  }
                >
                  {m.role === "assistant" ? <ChatRichText text={m.content} /> : m.content}
                </div>
              </div>
            ))}
            {pending ? (
              <p className="text-xs text-brand-muted">Thinking…</p>
            ) : null}
            {error ? (
              <p className="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</p>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-brand-border bg-white p-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 flex min-h-[36px] items-center justify-center rounded-md bg-[#25D366]/15 text-xs font-semibold text-[#128C7E] hover:bg-[#25D366]/25"
            >
              Continue on WhatsApp
            </a>
            <form onSubmit={onSubmit} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about lights…"
                maxLength={1000}
                className="min-h-[40px] flex-1 rounded-md border border-brand-border px-3 text-sm outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={pending || !input.trim()}
                className="rounded-md bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-navy disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[48px] items-center gap-2 rounded-full bg-brand py-3 pl-3.5 pr-4 text-white shadow-lg hover:bg-brand-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        aria-expanded={open}
        aria-label={open ? "Close chat" : "Open Orient assistant"}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
          AI
        </span>
        <span className="text-sm font-semibold tracking-wide">Ask Orient</span>
      </button>
    </div>
  );
}
