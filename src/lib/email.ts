import nodemailer from "nodemailer";
import { SITE } from "@/lib/types";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
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

/** True when this deployment can realistically deliver to sales@orientlighting.pk */
export function canDeliverPartnerEmail() {
  if (gmailConfigured()) return true;
  if (resendConfigured() && !usingResendTestFrom()) return true;
  return false;
}

export function emailHealthSnapshot() {
  const fromGmail = process.env.GMAIL_USER?.trim() || null;
  const fromResend = resendFrom();
  const to = process.env.PARTNER_NOTIFY_EMAIL?.trim() || SITE.emailSales;
  const gmail = gmailConfigured();
  const resend = resendConfigured();
  const testFrom = usingResendTestFrom();
  const canDeliver = canDeliverPartnerEmail();

  let status = "not_ready";
  let nextStep =
    "Add GMAIL_USER + GMAIL_APP_PASSWORD for sales@orientlighting.pk (Google App Password), or verify your domain in Resend and set RESEND_FROM off resend.dev.";

  if (gmail) {
    status = "ready_gmail";
    nextStep = "Partner form emails will send via Gmail SMTP.";
  } else if (resend && !testFrom) {
    status = "ready_resend";
    nextStep = "Partner form emails will send via Resend.";
  } else if (resend && testFrom) {
    status = "blocked_test_from_address";
    nextStep =
      "RESEND_API_KEY is set, but RESEND_FROM still uses onboarding@resend.dev which cannot email sales@orientlighting.pk. Prefer Gmail App Password, or verify orientlighting.com.pk in Resend.";
  } else {
    status = "missing_credentials";
  }

  return {
    ok: canDeliver,
    canDeliverToSales: canDeliver,
    status,
    nextStep,
    to,
    gmail: {
      configured: gmail,
      user: fromGmail,
    },
    resend: {
      configured: resend,
      from: fromResend,
      usingTestFrom: testFrom,
    },
    warning:
      resend && testFrom && !gmail
        ? "resendConfigured:true only means the API key exists. It does NOT mean sales@ can receive mail yet."
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
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not set." };
  }

  const from = resendFrom();
  const to = recipients(input.to);
  if (!to.length) return { ok: false, error: "No recipient address." };

  if (usingResendTestFrom()) {
    const error =
      "RESEND_FROM uses onboarding@resend.dev, which cannot send to sales@orientlighting.pk. Use Gmail SMTP or verify your domain in Resend.";
    console.error("[email]", error);
    return { ok: false, provider: "resend", status: 403, error };
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
        // keep raw
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

/**
 * Prefer Gmail SMTP (Google Workspace / App Password), then verified Resend domain.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (gmailConfigured()) {
    const gmail = await sendViaGmail(input);
    if (gmail.ok) return gmail;
    // fall through to Resend only if it can actually deliver
  }

  if (resendConfigured()) {
    return sendViaResend(input);
  }

  return {
    ok: false,
    error:
      "No email provider ready. Set GMAIL_USER + GMAIL_APP_PASSWORD, or a verified Resend domain + RESEND_FROM.",
  };
}
