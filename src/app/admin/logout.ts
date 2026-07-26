"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authCookieOptions } from "@/lib/supabase/cookieOptions";

/** Drop any leftover Supabase auth cookies if signOut fails mid-flight. */
async function clearAuthCookies() {
  const store = await cookies();
  for (const c of store.getAll()) {
    if (c.name.startsWith("sb-") && c.name.includes("auth-token")) {
      try {
        store.set(c.name, "", { ...authCookieOptions, maxAge: 0 });
      } catch {
        /* ignore — redirect still proceeds */
      }
    }
  }
}

export async function logoutAdmin() {
  try {
    const supabase = await createClient();
    // Local scope clears cookies without requiring a successful global revoke call.
    // Global revoke can throw (expired/missing refresh token) and crash the form action.
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    await clearAuthCookies();
  }

  redirect("/admin/login");
}
