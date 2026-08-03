"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { SITE } from "@/lib/types";

export type PartnerFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
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

export async function submitPartnerApplication(
  _prev: PartnerFormState,
  formData: FormData,
): Promise<PartnerFormState> {
  const honey = String(formData.get("company_website") || "").trim();
  if (honey) {
    return { ok: true, message: "Thank you — we received your application." };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  if (rateLimited(`partner:${ip}`)) {
    return { ok: false, message: "Too many attempts. Please try again shortly." };
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
  if (Object.keys(fieldErrors).length) {
    return {
      ok: false,
      message: "Please fill in the required fields.",
      fieldErrors,
    };
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

  const emailed = await sendEmail({
    to: notifyTo,
    subject: `Partner application — ${data.company_name}`,
    text,
    replyTo: data.email_address,
    fields: {
      company_name: data.company_name,
      contact_person_name: data.contact_person_name,
      designation: data.designation,
      mobile_number: data.mobile_number,
      email_address: data.email_address,
      city: data.city,
      business_type: data.business_type,
      years_in_business: data.years_in_business,
      led_experience: data.led_experience,
      areas_served: data.areas_served,
      average_sales_revenue: data.average_sales_revenue,
      why_partner: data.why_partner,
      additional_comments: data.additional_comments || "—",
    },
  });

  if (!emailed) {
    console.error("[partner] Application saved but email notify failed for", notifyTo);
  }

  return {
    ok: true,
    message: "Thank you — your application was submitted. Our sales team will contact you soon.",
  };
}
