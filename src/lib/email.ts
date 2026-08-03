import { SITE } from "@/lib/types";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
  /** Extra key/value fields for FormSubmit fallback body. */
  fields?: Record<string, string>;
};

function notifyAddress(to: string | string[]): string {
  const first = Array.isArray(to) ? to[0] : to;
  return (process.env.PARTNER_NOTIFY_EMAIL || first || SITE.emailSales).trim();
}

async function sendViaResend(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const from =
    process.env.RESEND_FROM?.trim() ||
    `${SITE.name} <onboarding@resend.dev>`;

  const to = Array.isArray(input.to) ? input.to : [input.to];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: input.subject,
      text: input.text,
      reply_to: input.replyTo || undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[email] Resend error:", res.status, body);
    return false;
  }
  return true;
}

/**
 * FormSubmit fallback — no API key required.
 * First submission sends an activation email to the inbox; click Activate once.
 */
async function sendViaFormSubmit(input: SendEmailInput): Promise<boolean> {
  const to = notifyAddress(input.to);
  if (!to) return false;

  const payload: Record<string, string> = {
    _subject: input.subject,
    _template: "table",
    message: input.text,
    ...(input.fields || {}),
  };
  if (input.replyTo) {
    payload.email = input.replyTo;
    payload._replyto = input.replyTo;
  }

  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await res.text().catch(() => "");
  if (!res.ok) {
    console.error("[email] FormSubmit error:", res.status, body);
    return false;
  }

  // FormSubmit returns JSON; activation-needed still counts as accepted delivery path
  try {
    const json = JSON.parse(body) as { success?: string | boolean; message?: string };
    if (json.message && /activation/i.test(json.message)) {
      console.warn("[email] FormSubmit needs inbox activation for", to, json.message);
    }
  } catch {
    // ignore non-JSON
  }
  return true;
}

/**
 * Prefer Resend when RESEND_API_KEY is set; otherwise FormSubmit.co fallback.
 */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  try {
    if (await sendViaResend(input)) return true;
  } catch (err) {
    console.error("[email] Resend failed:", err);
  }

  try {
    return await sendViaFormSubmit(input);
  } catch (err) {
    console.error("[email] FormSubmit failed:", err);
    return false;
  }
}
