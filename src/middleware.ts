import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Only allow same-origin relative /admin paths (blocks open redirects). */
function safeAdminPath(raw: string | null | undefined, fallback = "/admin/products"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/admin")) return fallback;
  if (
    raw.startsWith("//") ||
    raw.includes("://") ||
    raw.includes("\\") ||
    raw.includes("@") ||
    raw.includes("..")
  ) {
    return fallback;
  }
  return raw.split("#")[0];
}

function withAdminSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Cache-Control", "no-store, max-age=0");
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "img-src 'self' data: blob: https://*.supabase.co",
        "font-src 'self' data:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self' 'unsafe-inline'",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      ].join("; "),
    );
  }
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-orient-admin", "1");

  // Logout must not refresh/re-attach session cookies from updateSession
  if (pathname === "/admin/logout") {
    return withAdminSecurityHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const { supabase, supabaseResponse, user } = await updateSession(request);

  const copyCookies = (res: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
    return withAdminSecurityHeaders(res);
  };

  if (pathname === "/admin/login") {
    if (user && adminEmail && user.email?.toLowerCase() === adminEmail) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/products";
      url.search = "";
      return copyCookies(NextResponse.redirect(url));
    }
    // Non-allowlisted session must not linger on admin login
    if (user && (!adminEmail || user.email?.toLowerCase() !== adminEmail)) {
      await supabase.auth.signOut({ scope: "local" });
    }
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    return copyCookies(res);
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    url.searchParams.set("next", safeAdminPath(pathname));
    return copyCookies(NextResponse.redirect(url));
  }

  if (!adminEmail || user.email?.toLowerCase() !== adminEmail) {
    await supabase.auth.signOut({ scope: "local" });
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    url.searchParams.set("error", "unauthorized");
    return copyCookies(NextResponse.redirect(url));
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  return copyCookies(res);
}

export const config = {
  matcher: ["/admin/:path*"],
};
