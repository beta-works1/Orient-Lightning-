import DOMPurify from "isomorphic-dompurify";

/** Allowlisted tags for catalogue/admin product HTML descriptions. */
const ALLOWED_TAGS = [
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
];

const ALLOWED_ATTR = ["href", "target", "rel", "class", "colspan", "rowspan"];

/**
 * Sanitize admin/CMS HTML before rendering with dangerouslySetInnerHTML.
 * Strips scripts, event handlers, and dangerous URLs.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
  });
}
