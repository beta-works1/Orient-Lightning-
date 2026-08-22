import { NextResponse } from "next/server";
import { canDeliverPartnerEmail, emailHealthSnapshot, sendEmail } from "@/lib/email";
import { SITE } from "@/lib/types";

/**
 * Diagnostics for partner email delivery.
 * GET/POST both require EMAIL_HEALTH_SECRET (fail closed).
 */
function authorize(req: Request): boolean {
  const secret = process.env.EMAIL_HEALTH_SECRET?.trim();
  const provided = req.headers.get("x-email-health-secret")?.trim();
  return Boolean(secret && provided && provided === secret);
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  if (!authorize(req)) return unauthorized();
  const health = emailHealthSnapshot();
  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}

export async function POST(req: Request) {
  if (!authorize(req)) return unauthorized();

  if (!canDeliverPartnerEmail()) {
    return NextResponse.json(
      { error: "No email provider configured.", health: emailHealthSnapshot() },
      { status: 503 },
    );
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
