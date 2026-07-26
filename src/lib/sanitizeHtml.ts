/**
 * Serverless-safe HTML sanitizer (no jsdom / DOMPurify).
 * isomorphic-dompurify crashes on Vercel Node serverless for product/collection pages.
 *
 * Allowlists tags/attrs used by catalogue CMS HTML and strips scripts, event handlers,
 * and dangerous URLs.
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "span",
  "div",
  "a",
]);

const VOID_TAGS = new Set(["br"]);

const ALLOWED_ATTR = new Set(["href", "target", "rel", "class", "colspan", "rowspan"]);

function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  // Allow relative paths and https/http/mailto/tel only
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  if (trimmed.startsWith("#")) return true;
  return /^(https?:|mailto:|tel:)/i.test(trimmed);
}

function parseAttrs(raw: string): string {
  const out: string[] = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const name = m[1].toLowerCase();
    if (!ALLOWED_ATTR.has(name)) continue;
    if (name.startsWith("on")) continue;
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    if (name === "href") {
      if (!isSafeUrl(value)) continue;
      out.push(`href="${escapeText(value)}"`);
      continue;
    }
    if (name === "target") {
      if (value === "_blank" || value === "_self") {
        out.push(`target="${value}"`);
      }
      continue;
    }
    if (name === "rel") {
      // Only allow noopener/noreferrer/nofollow combinations
      const parts = value
        .toLowerCase()
        .split(/\s+/)
        .filter((p) => p === "noopener" || p === "noreferrer" || p === "nofollow");
      if (parts.length) out.push(`rel="${parts.join(" ")}"`);
      continue;
    }
    if (name === "class") {
      // Keep simple class tokens only
      const cls = value
        .split(/\s+/)
        .filter((c) => /^[a-zA-Z0-9_-]+$/.test(c))
        .join(" ");
      if (cls) out.push(`class="${cls}"`);
      continue;
    }
    if (name === "colspan" || name === "rowspan") {
      if (/^\d{1,2}$/.test(value)) out.push(`${name}="${value}"`);
    }
  }

  // If href present and target=_blank, ensure rel has noopener noreferrer
  const hasHref = out.some((a) => a.startsWith("href="));
  const hasBlank = out.some((a) => a === 'target="_blank"');
  if (hasHref && hasBlank) {
    const relIdx = out.findIndex((a) => a.startsWith("rel="));
    const needed = "noopener noreferrer";
    if (relIdx === -1) out.push(`rel="${needed}"`);
    else {
      const existing = out[relIdx].slice(5, -1).replace(/"/g, "");
      const set = new Set(`${existing} ${needed}`.trim().split(/\s+/));
      out[relIdx] = `rel="${[...set].join(" ")}"`;
    }
  }

  return out.length ? ` ${out.join(" ")}` : "";
}

/**
 * Sanitize admin/CMS HTML before rendering with dangerouslySetInnerHTML.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";

  // Drop whole dangerous blocks early
  let html = dirty
    .replace(/<(script|style|iframe|object|embed|link|meta|form|input|button|textarea|select)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?(script|style|iframe|object|embed|link|meta|form|input|button|textarea|select)\b[^>]*>/gi, "");

  let result = "";
  const tokenRe = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(html))) {
    if (m[0].startsWith("<!--")) continue;
    if (m[3] != null) {
      // Text between tags — no '<' present; keep entities as authored (avoid &amp;amp;).
      result += m[3];
      continue;
    }
    const tag = m[1].toLowerCase();
    const isClose = m[0].startsWith("</");
    if (!ALLOWED_TAGS.has(tag)) continue;

    if (isClose) {
      if (!VOID_TAGS.has(tag)) result += `</${tag}>`;
      continue;
    }

    const selfClosing = /\/\s*>$/.test(m[0]) || VOID_TAGS.has(tag);
    const attrs = tag === "br" ? "" : parseAttrs(m[2] || "");
    if (selfClosing || VOID_TAGS.has(tag)) {
      result += `<${tag}${attrs}>`;
    } else {
      result += `<${tag}${attrs}>`;
    }
  }

  return result;
}
