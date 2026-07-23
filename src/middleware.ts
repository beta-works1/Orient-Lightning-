import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-orient-admin", "1");

  if (pathname === "/admin/login") {
    const { supabaseResponse, user } = await updateSession(request);
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (user && adminEmail && user.email?.toLowerCase() === adminEmail) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/products";
      return NextResponse.redirect(url);
    }
    const res = NextResponse.next({
      request: { headers: requestHeaders },
    });
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  }

  const { supabaseResponse, user } = await updateSession(request);
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!adminEmail || user.email?.toLowerCase() !== adminEmail) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
