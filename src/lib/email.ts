import { SITE } from "@/lib/types";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
};

export type SendEmailResult = {
  ok: boolean;
  provider?: "resend";
  error?: string;
  status?: number;
};

/**
 * Send via Resend.
 *
 * Requires RESEND_API_KEY on Vercel.
 * onboarding@resend.dev can ONLY send to your Resend account email.
 * To reach sales@orientlighting.pk, verify orientlighting.com.pk (or a subdomain)
 * in Resend Domains and set RESEND_FROM to an address on that domain, e.g.
 *   Orient Lighting <noreply@orientlighting.com.pk>
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    const error = "RESEND_API_KEY is not set on this deployment.";
    console.error("[email]", error);
    return { ok: false, error };
  }

  const from =
    process.env.RESEND_FROM?.trim() ||
    `${SITE.name} <onboarding@resend.dev>`;

  const to = (Array.isArray(input.to) ? input.to : [input.to])
    .map((addr) => addr.trim())
    .filter(Boolean);

  if (!to.length) {
    return { ok: false, error: "No recipient address." };
  }

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

    const body = await res.text().catch(() => "");
    if (!res.ok) {
      let detail = body;
      try {
        const json = JSON.parse(body) as { message?: string; name?: string };
        detail = json.message || json.name || body;
      } catch {
        // keep raw body
      }
      const error = `Resend ${res.status}: ${detail}`;
      console.error("[email]", error, { from, to });
      return { ok: false, provider: "resend", status: res.status, error };
    }

    return { ok: true, provider: "resend", status: res.status };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Network error talking to Resend";
    console.error("[email] Resend request failed:", error);
    return { ok: false, provider: "resend", error };
  }
}
