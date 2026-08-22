import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

function assertAdminEmail(email: string | undefined) {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!admin || !email || email.toLowerCase() !== admin) {
    throw new Error("Unauthorized");
  }
}

/** Cookie session + admin_users allowlist. Throws "Unauthorized" on failure. */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  assertAdminEmail(user?.email);

  const sb = createServiceClient();
  const { data: row, error } = await sb
    .from("admin_users")
    .select("email")
    .ilike("email", user!.email!)
    .maybeSingle();
  if (error) throw new Error(`admin allowlist: ${error.message}`);
  if (!row) throw new Error("Unauthorized");

  return user!;
}
