import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authCookieOptions } from "@/lib/supabase/cookieOptions";

export const dynamic = "force-dynamic";

/**
 * Hard HTTP logout — avoids Server Action + redirect crashes that leave
 * the browser on /admin/products with an opaque digest error.
 */
async function handleLogout(request: Request) {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anon) {
    try {
      const supabase = createServerClient(url, anon, {
        cookieOptions: authCookieOptions,
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, { ...authCookieOptions, ...options });
              } catch {
                /* ignore */
              }
            });
          },
        },
      });
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      /* fall through to manual clear */
    }
  }

  // Always wipe auth cookies even if Supabase client failed
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith("sb-") && c.name.includes("auth-token")) {
      try {
        cookieStore.set(c.name, "", { ...authCookieOptions, maxAge: 0 });
      } catch {
        /* ignore */
      }
    }
  }

  const login = new URL("/admin/login", request.url);
  return NextResponse.redirect(login, { status: 303 });
}

export async function GET(request: Request) {
  return handleLogout(request);
}

export async function POST(request: Request) {
  return handleLogout(request);
}
