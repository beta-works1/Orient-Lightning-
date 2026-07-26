"use server";

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

export type NewsletterState = {
  ok: boolean;
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Simple in-memory rate limit (per server instance) — best-effort spam brake. */
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

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

export async function subscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  // Honeypot — bots fill this; humans never see it
  const honey = String(formData.get("company_website") || "").trim();
  if (honey) {
    return { ok: true, message: "Thanks for subscribing!" };
  }

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  if (rateLimited(`nl:${ip}`)) {
    return { ok: false, message: "Too many attempts. Please try again shortly." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { ok: false, message: "Subscription is temporarily unavailable." };
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await sb.from("newsletter_subscribers").insert({ email });
  if (error) {
    // Unique violation / already subscribed — treat as success (no email enumeration)
    if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
      return { ok: true, message: "You're already subscribed. Thank you!" };
    }
    return { ok: false, message: "Could not subscribe right now. Please try again." };
  }

  return { ok: true, message: "Thanks for subscribing!" };
}
