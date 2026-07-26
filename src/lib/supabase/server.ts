import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authCookieOptions } from "@/lib/supabase/cookieOptions";

/** Server Components / Server Actions — cookie session, anon key. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            // Prefer Supabase options last so signOut can set maxAge: 0 and clear cookies.
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...authCookieOptions, ...options }),
            );
          } catch {
            /* Called from a Server Component — middleware will refresh sessions. */
          }
        },
      },
    },
  );
}
