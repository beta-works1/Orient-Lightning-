"use server";

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

export type NewsletterState = {
  ok: boolean;
  message: string;
};

export async function subscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  // Local file store until dedicated Supabase project is wired
  const dir = path.join(process.cwd(), "data");
  const file = path.join(dir, "newsletter.json");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  let list: { email: string; createdAt: string }[] = [];
  if (existsSync(file)) {
    try {
      list = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      list = [];
    }
  }

  if (list.some((x) => x.email === email)) {
    return { ok: true, message: "You're already subscribed. Thank you!" };
  }

  list.push({ email, createdAt: new Date().toISOString() });
  writeFileSync(file, JSON.stringify(list, null, 2));

  return { ok: true, message: "Thanks for subscribing!" };
}
