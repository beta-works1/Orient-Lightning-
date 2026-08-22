"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/admin";
import { canDeliverPartnerEmail, sendEmail } from "@/lib/email";
import { PARTNER_HONEYPOT_FIELD } from "@/lib/partnerFormFields";
import { SITE } from "@/lib/types";

export type PartnerFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  applicantEmail?: string;
  /** True only when a configured server provider accepted the message. */
  emailed?: boolean;
  /** Honeypot tripped — HTTP-ok no-op; client must not show success chrome. */
  ignored?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = 2000;
const SHORT_MAX = 200;

const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || now > row.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  row.count += 1;
  return row.count > MAX_PER_WINDOW;
}

function required(formData: FormData, key: string, max = SHORT_MAX): string {
  return String(formData.get(key) || "")
    .trim()
    .slice(0, max);
}

const SAVED_MESSAGE =
  "Thank you — your application was saved. Our team will review it.";
const EMAILED_MESSAGE =
  "Thank you — your application was submitted. Our sales team will contact you soon.";

export async function submitPartnerApplication(
  _prev: PartnerFormState,
  formData: FormData,
): Promise<PartnerFormState> {
  const honey = String(formData.get(PARTNER_HONEYPOT_FIELD) || "").trim();
  if (honey) {
    return { ok: true, ignored: true, emailed: false, message: "" };
  }

  const data = {
    company_name: required(formData, "company_name"),
    contact_person_name: required(formData, "contact_person_name"),
    designation: required(formData, "designation"),
    mobile_number: required(formData, "mobile_number", 40),
    email_address: required(formData, "email_address", 254).toLowerCase(),
    city: required(formData, "city"),
    business_type: required(formData, "business_type"),
    years_in_business: required(formData, "years_in_business", 80),
    led_experience: required(formData, "led_experience", MAX_LEN),
    areas_served: required(formData, "areas_served", MAX_LEN),
    average_sales_revenue: required(formData, "average_sales_revenue", MAX_LEN),
    why_partner: required(formData, "why_partner", MAX_LEN),
    additional_comments: required(formData, "additional_comments", MAX_LEN),
  };

  const fieldErrors: Record<string, string> = {};
  const requiredKeys: (keyof typeof data)[] = [
    "company_name",
    "contact_person_name",
    "designation",
    "mobile_number",
    "email_address",
    "city",
    "business_type",
    "years_in_business",
    "led_experience",
    "areas_served",
    "average_sales_revenue",
    "why_partner",
  ];

  for (const key of requiredKeys) {
    if (!data[key]) fieldErrors[key] = "Required.";
  }
  if (data.email_address && !EMAIL_RE.test(data.email_address)) {
    fieldErrors.email_address = "Enter a valid email address.";
  }
  const mobileDigits = data.mobile_number.replace(/\D/g, "");
  if (data.mobile_number && mobileDigits.length < 7) {
    fieldErrors.mobile_number = "Enter a valid mobile number.";
  }
  if (Object.keys(fieldErrors).length) {
    return {
      ok: false,
      message: "Please fill in the required fields.",
      fieldErrors,
    };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  if (rateLimited(`partner:${ip}`)) {
    return { ok: false, message: "Too many attempts. Please try again shortly." };
  }

  try {
    const sb = createServiceClient();
    const { error } = await sb.from("partner_applications").insert(data);
    if (error) {
      console.error("[partner] insert failed:", error.message);
      return { ok: false, message: "Could not submit right now. Please try again." };
    }
  } catch (err) {
    console.error("[partner] insert error:", err);
    return { ok: false, message: "Could not submit right now. Please try again." };
  }

  revalidatePath("/admin/partners");

  let emailed = false;
  if (canDeliverPartnerEmail()) {
    const text = [
      "New distribution partner application",
      "",
      `Company Name: ${data.company_name}`,
      `Contact Person: ${data.contact_person_name}`,
      `Designation: ${data.designation}`,
      `Mobile: ${data.mobile_number}`,
      `Email: ${data.email_address}`,
      `City: ${data.city}`,
      `Business Type: ${data.business_type}`,
      `Years in Business: ${data.years_in_business}`,
      `LED experience: ${data.led_experience}`,
      `Areas served: ${data.areas_served}`,
      `Average sales revenue: ${data.average_sales_revenue}`,
      `Why partner: ${data.why_partner}`,
      `Additional comments: ${data.additional_comments || "—"}`,
      "",
      `Submitted via ${SITE.name} website`,
    ].join("\n");

    const notifyTo =
      process.env.PARTNER_NOTIFY_EMAIL?.trim() || SITE.emailSales;

    const emailResult = await sendEmail({
      to: notifyTo,
      subject: `Partner application — ${data.company_name}`,
      text,
      replyTo: data.email_address,
    });
    emailed = emailResult.ok;
    if (!emailResult.ok) {
      console.error("[partner] Server email failed; lead is in /admin/partners:", {
        to: notifyTo,
        error: emailResult.error,
        provider: emailResult.provider,
      });
    }
  }

  return {
    ok: true,
    emailed,
    message: emailed ? EMAILED_MESSAGE : SAVED_MESSAGE,
    applicantEmail: data.email_address,
  };
}
