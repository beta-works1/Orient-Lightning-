import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { SITE } from "@/lib/types";

/**
 * Diagnostics for Resend ↔ Vercel wiring.
 * GET /api/email/health  — checks env only (safe)
 * POST /api/email/health — sends a test email (requires EMAIL_HEALTH_SECRET header)
 */
export async function GET() {
  const hasKey = Boolean(process.env.RESEND_API_KEY?.trim());
  const from =
    process.env.RESEND_FROM?.trim() ||
    `${SITE.name} <onboarding@resend.dev>`;
  const to = process.env.PARTNER_NOTIFY_EMAIL?.trim() || SITE.emailSales;
  const usingTestFrom = /resend\.dev/i.test(from);

  return NextResponse.json({
    resendConfigured: hasKey,
    from,
    to,
    usingTestFrom,
    warning: usingTestFrom
      ? "onboarding@resend.dev can only send to your Resend account email. Verify orientlighting.com.pk in Resend and set RESEND_FROM to an address on that domain to reach sales@orientlighting.pk."
      : null,
  });
}

export async function POST(req: Request) {
  const secret = process.env.EMAIL_HEALTH_SECRET?.trim();
  const provided = req.headers.get("x-email-health-secret")?.trim();
  if (!secret || !provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const to = process.env.PARTNER_NOTIFY_EMAIL?.trim() || SITE.emailSales;
  const result = await sendEmail({
    to,
    subject: `${SITE.name} — Resend connectivity test`,
    text: `This is a test email from the Orient Lighting Vercel deployment.\n\nIf you received this, Resend is wired correctly.\nTime: ${new Date().toISOString()}`,
  });

  return NextResponse.json(
    {
      to,
      ...result,
    },
    { status: result.ok ? 200 : 502 },
  );
}
