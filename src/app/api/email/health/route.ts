import { NextResponse } from "next/server";
import { emailHealthSnapshot, sendEmail } from "@/lib/email";
import { SITE } from "@/lib/types";

/**
 * Diagnostics for partner email delivery.
 * GET  /api/email/health — config status (safe)
 * POST /api/email/health — send test mail (requires EMAIL_HEALTH_SECRET header)
 */
export async function GET() {
  return NextResponse.json(emailHealthSnapshot());
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
    subject: `${SITE.name} — email connectivity test`,
    text: `This is a test email from the Orient Lighting Vercel deployment.\n\nIf you received this, partner notifications are working.\nTime: ${new Date().toISOString()}`,
  });

  return NextResponse.json(
    {
      to,
      health: emailHealthSnapshot(),
      ...result,
    },
    { status: result.ok ? 200 : 502 },
  );
}
