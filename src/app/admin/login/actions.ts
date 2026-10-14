"use server";

import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
  redirectTo?: string;
};

function safeNext(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw : "";
  if (!value) return "/admin/products";
  if (
    !value.startsWith("/admin") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("@") ||
    value.includes("://") ||
    value.includes("..")
  ) {
    return "/admin/products";
  }
  return value.split("#")[0];
}

/**
 * Server-side login so session cookies can be httpOnly.
 * Allowlist is enforced again in middleware after redirect.
 */
export async function loginAdmin(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Invalid email or password." };
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  // Reject non-allowlisted emails before hitting Auth when possible (same generic message)
  if (adminEmail && email !== adminEmail) {
    return { error: "Invalid email or password." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: "Invalid email or password." };
    }

    // Double-check allowlist after successful Auth (defense in depth)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!adminEmail || user?.email?.toLowerCase() !== adminEmail) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        /* ignore */
      }
      return { error: "Invalid email or password." };
    }

    // Signing in is not enough: mutations also require the database allowlist.
    // Check it here so a missing entry does not look like an expired session
    // only after the administrator attempts to save a change.
    const { data: admin, error: allowlistError } = await supabase
      .from("admin_users")
      .select("email")
      .ilike("email", user.email!)
      .maybeSingle();
    if (allowlistError || !admin) {
      if (allowlistError) console.error("[admin login allowlist]", allowlistError.message);
      await supabase.auth.signOut({ scope: "local" });
      return {
        error: allowlistError
          ? "Could not verify admin access. Please try again."
          : "This account is not enabled for admin access. Contact the site owner.",
      };
    }

    // Let the client perform a full document navigation. Server-action redirects can
    // leave an old Vercel RSC tree mounted after a deployment or cache invalidation.
    return { redirectTo: next };
  } catch (error) {
    console.error("[admin login]", error);
    return { error: "Could not sign in right now. Please try again." };
  }
}
