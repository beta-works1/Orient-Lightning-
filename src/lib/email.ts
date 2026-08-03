import nodemailer from "nodemailer";
import { SITE } from "@/lib/types";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
  fields?: Record<string, string>;
};

export type SendEmailResult = {
  ok: boolean;
  provider?: "gmail" | "resend" | "formsubmit";
  error?: string;
  status?: number;
};

function recipients(to: string | string[]): string[] {
  return (Array.isArray(to) ? to : [to]).map((a) => a.trim()).filter(Boolean);
}

function notifyDefault(to: string | string[]) {
  const first = recipients(to)[0];
  return (process.env.PARTNER_NOTIFY_EMAIL || first || SITE.emailSales).trim();
}

function gmailConfigured() {
  return Boolean(
    process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim(),
  );
}

function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function resendFrom() {
  return (
    process.env.RESEND_FROM?.trim() ||
    `${SITE.name} <onboarding@resend.dev>`
  );
}

function usingResendTestFrom() {
  return /resend\.dev/i.test(resendFrom());
}

function resendCanDeliver() {
  return resendConfigured() && !usingResendTestFrom();
}

/** True when this deployment can deliver partner emails. */
export function canDeliverPartnerEmail() {
  // FormSubmit is always available as last resort for sales@ notify.
  return true;
}

export function emailHealthSnapshot() {
  const to = process.env.PARTNER_NOTIFY_EMAIL?.trim() || SITE.emailSales;
  const gmail = gmailConfigured();
  const resend = resendConfigured();
  const testFrom = usingResendTestFrom();

  let status = "ready_formsubmit";
  let nextStep =
    "Partner emails will send via FormSubmit to sales@orientlighting.pk. Optionally add Gmail App Password for a more durable setup.";
  let provider: "gmail" | "resend" | "formsubmit" = "formsubmit";

  if (gmail) {
    status = "ready_gmail";
    provider = "gmail";
    nextStep = "Partner emails will send via Gmail SMTP first.";
  } else if (resendCanDeliver()) {
    status = "ready_resend";
    provider = "resend";
    nextStep = "Partner emails will send via Resend first.";
  }

  return {
    ok: true,
    canDeliverToSales: true,
    status,
    preferredProvider: provider,
    nextStep,
    to,
    gmail: {
      configured: gmail,
      user: process.env.GMAIL_USER?.trim() || null,
    },
    resend: {
      configured: resend,
      from: resendFrom(),
      usingTestFrom: testFrom,
      canDeliver: resendCanDeliver(),
    },
    formsubmit: {
      configured: true,
      note: "Fallback to sales@orientlighting.pk when Gmail/Resend are unavailable.",
    },
    warning:
      !gmail && !resendCanDeliver()
        ? "Using FormSubmit fallback. For long-term reliability, add GMAIL_USER + GMAIL_APP_PASSWORD on Vercel."
        : null,
  };
}

async function sendViaGmail(input: SendEmailInput): Promise<SendEmailResult> {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) {
    return { ok: false, error: "Gmail SMTP is not configured." };
  }

  const to = recipients(input.to);
  if (!to.length) return { ok: false, error: "No recipient address." };

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `${SITE.name} <${user}>`,
      to: to.join(", "),
      replyTo: input.replyTo || undefined,
      subject: input.subject,
      text: input.text,
    });

    return { ok: true, provider: "gmail" };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Gmail SMTP send failed";
    console.error("[email] Gmail error:", error);
    return { ok: false, provider: "gmail", error };
  }
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY is not set." };
  if (usingResendTestFrom()) {
    return {
      ok: false,
      provider: "resend",
      status: 403,
      error: "Skipping Resend test sender (cannot reach sales@).",
    };
  }

  const from = resendFrom();
  const to = recipients(input.to);
  if (!to.length) return { ok: false, error: "No recipient address." };

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
        const json = JSON.parse(body) as { message?: string };
        detail = json.message || body;
      } catch {
        // keep raw
      }
      return {
        ok: false,
        provider: "resend",
        status: res.status,
        error: `Resend ${res.status}: ${detail}`,
      };
    }

    return { ok: true, provider: "resend", status: res.status };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Resend network error";
    return { ok: false, provider: "resend", error };
  }
}

async function sendViaFormSubmit(input: SendEmailInput): Promise<SendEmailResult> {
  const to = notifyDefault(input.to);
  if (!to) return { ok: false, error: "No recipient address." };

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://orientlighting.com.pk";

  const payload: Record<string, string> = {
    _subject: input.subject,
    _template: "table",
    _captcha: "false",
    message: input.text,
    ...(input.fields || {}),
  };
  if (input.replyTo) {
    payload.email = input.replyTo;
    payload._replyto = input.replyTo;
  }

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: site,
        Referer: `${site}/pages/become-our-partner`,
        "User-Agent":
          "Mozilla/5.0 (compatible; OrientLightingBot/1.0; +https://orientlighting.com.pk)",
      },
      body: JSON.stringify(payload),
    });

    const body = await res.text().catch(() => "");
    if (!res.ok) {
      return {
        ok: false,
        provider: "formsubmit",
        status: res.status,
        error: `FormSubmit ${res.status}: ${body}`,
      };
    }

    try {
      const json = JSON.parse(body) as { success?: string | boolean; message?: string };
      if (json.success === false || json.success === "false") {
        return {
          ok: false,
          provider: "formsubmit",
          error: json.message || body,
        };
      }
      if (json.message && /activation/i.test(json.message)) {
        return {
          ok: false,
          provider: "formsubmit",
          error: json.message,
        };
      }
    } catch {
      // non-JSON success body — treat as ok if HTTP 200
    }

    return { ok: true, provider: "formsubmit" };
  } catch (err) {
    const error = err instanceof Error ? err.message : "FormSubmit network error";
    return { ok: false, provider: "formsubmit", error };
  }
}

/**
 * Gmail → verified Resend → FormSubmit (guaranteed path for sales@).
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (gmailConfigured()) {
    const gmail = await sendViaGmail(input);
    if (gmail.ok) return gmail;
    console.error("[email] Gmail failed, trying next provider:", gmail.error);
  }

  if (resendCanDeliver()) {
    const resend = await sendViaResend(input);
    if (resend.ok) return resend;
    console.error("[email] Resend failed, trying FormSubmit:", resend.error);
  }

  const form = await sendViaFormSubmit(input);
  if (!form.ok) {
    console.error("[email] FormSubmit failed:", form.error);
  }
  return form;
}
