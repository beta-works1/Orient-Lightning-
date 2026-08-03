import { SITE } from "@/lib/types";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
};

/**
 * Sends email via Resend REST API when RESEND_API_KEY is configured.
 * Returns false (without throwing) when email is not configured or the API fails.
 */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is not set — skipping send.");
    return false;
  }

  const from =
    process.env.RESEND_FROM?.trim() ||
    `${SITE.name} <onboarding@resend.dev>`;

  const to = Array.isArray(input.to) ? input.to : [input.to];

  try {
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
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}
