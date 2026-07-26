"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/** Only same-origin catalogue paths + WhatsApp — never arbitrary URLs from the model. */
function safeChatHref(href: string): string | null {
  const raw = href.trim();
  if (
    !raw ||
    raw.includes("\\") ||
    raw.includes("@") ||
    (raw.includes("://") && !raw.startsWith("https://"))
  ) {
    return null;
  }
  if (raw.startsWith("/")) {
    if (raw.startsWith("//") || raw.includes("..")) return null;
    if (
      raw.startsWith("/products/") ||
      raw.startsWith("/collections/") ||
      raw.startsWith("/pages/") ||
      raw.startsWith("/blogs/") ||
      raw.startsWith("/stores")
    ) {
      return raw;
    }
    return null;
  }
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(raw)) return raw;
  return null;
}

function renderBold(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <strong key={`${keyPrefix}-b${i++}`} className="font-semibold">
        {m[1]}
      </strong>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Turns `[label](/products/…)` into clickable links; supports **bold**. */
export function ChatRichText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) {
      nodes.push(
        <Fragment key={`t${i}`}>{renderBold(text.slice(last, m.index), `t${i}`)}</Fragment>,
      );
    }
    const label = m[1];
    const href = safeChatHref(m[2]);
    if (href?.startsWith("/")) {
      nodes.push(
        <Link
          key={`l${i}`}
          href={href}
          className="font-semibold text-brand underline underline-offset-2 hover:text-brand-navy"
        >
          {label}
        </Link>,
      );
    } else if (href) {
      nodes.push(
        <a
          key={`l${i}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand underline underline-offset-2 hover:text-brand-navy"
        >
          {label}
        </a>,
      );
    } else {
      nodes.push(<Fragment key={`t${i}`}>{renderBold(m[0], `f${i}`)}</Fragment>);
    }
    last = m.index + m[0].length;
    i += 1;
  }
  if (last < text.length) {
    nodes.push(
      <Fragment key={`t${i}`}>{renderBold(text.slice(last), `t${i}`)}</Fragment>,
    );
  }
  return <span className="whitespace-pre-wrap">{nodes}</span>;
}
