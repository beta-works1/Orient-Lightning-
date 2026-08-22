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
  provider?: "gmail" | "resend";
  error?: string;
  status?: number;
};

function recipients(to: string | string[]): string[] {
  return (Array.isArray(to) ? to : [to]).map((a) => a.trim()).filter(Boolean);
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

/** True only when Gmail SMTP or a verified Resend sender is configured. */
export function canDeliverPartnerEmail() {
  return gmailConfigured() || resendCanDeliver();
}

export function emailHealthSnapshot() {
  const to = process.env.PARTNER_NOTIFY_EMAIL?.trim() || SITE.emailSales;
  const gmail = gmailConfigured();
  const resend = resendConfigured();
  const testFrom = usingResendTestFrom();
  const canDeliver = canDeliverPartnerEmail();

  let status = "not_configured";
  let nextStep =
    "Partner applications are saved to /admin/partners. Optional: add GMAIL_USER + GMAIL_APP_PASSWORD, or a verified RESEND_FROM on your domain.";
  let provider: "gmail" | "resend" | null = null;

  if (gmail) {
    status = "ready_gmail";
    provider = "gmail";
    nextStep = "Partner emails will send via Gmail SMTP.";
  } else if (resendCanDeliver()) {
    status = "ready_resend";
    provider = "resend";
    nextStep = "Partner emails will send via Resend.";
  }

  return {
    ok: canDeliver,
    canDeliverToSales: canDeliver,
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
    warning: canDeliver
      ? null
      : "No mail provider can reach sales@. Operators review leads at /admin/partners.",
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

/**
 * Gmail, then verified Resend. No FormSubmit — Vercel IPs are blocked and
 * the browser path is not a product delivery channel.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (gmailConfigured()) {
    const gmail = await sendViaGmail(input);
    if (gmail.ok) return gmail;
    console.error("[email] Gmail failed:", gmail.error);
    if (!resendCanDeliver()) return gmail;
  }

  if (resendCanDeliver()) {
    const resend = await sendViaResend(input);
    if (!resend.ok) {
      console.error("[email] Resend failed:", resend.error);
    }
    return resend;
  }

  return { ok: false, error: "No email provider configured." };
}
