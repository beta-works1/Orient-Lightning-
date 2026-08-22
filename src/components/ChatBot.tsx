"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChatRichText } from "@/components/chat/ChatRichText";
import { useCompare } from "@/components/compare/CompareProvider";
import { SITE, WHATSAPP_URL } from "@/lib/types";

type Msg = { role: "user" | "assistant"; content: string };

const STARTER: Msg = {
  role: "assistant",
  content:
    "Hi — I’m the Orient Lighting assistant. Ask about bulbs, panels, street lights, wattage, or color temperature. For quotes, tap WhatsApp anytime.",
};

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([STARTER]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { items, ready } = useCompare();

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
        body: JSON.stringify({
          messages: next,
          compareHandles: ready ? items.map((i) => i.handle) : [],
        }),
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
      className="orient-fab-stack fixed right-4 z-50 flex flex-col items-end gap-3 sm:right-6"
      style={{ bottom: "calc(1.5rem + var(--orient-fab-offset, 0px))" }}
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

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat with ${SITE.name} on WhatsApp`}
        title={`WhatsApp ${SITE.phoneDisplay}`}
        className="group flex items-center gap-2 rounded-full bg-[#25D366] py-3 pl-3.5 pr-4 text-white shadow-lg transition hover:bg-[#1ebe57] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-6 w-6 shrink-0 fill-current"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="pr-0.5 text-sm font-semibold tracking-wide">WhatsApp</span>
      </a>
    </div>
  );
}
