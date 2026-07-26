"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logoutAdmin() {
  const supabase = await createClient();
  // Global scope invalidates refresh token server-side across devices/sessions
  await supabase.auth.signOut({ scope: "global" });
  redirect("/admin/login");
}
