import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";

test("a refreshed admin session reaches the server action and browser", async (t) => {
  const previous = { ...process.env };
  t.after(() => {
    for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "ADMIN_EMAIL"]) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://session-test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.ADMIN_EMAIL = "admin@example.com";
  const user = { id: "admin-test-user", email: "admin@example.com", app_metadata: {}, user_metadata: {} };
  const jwt = (expires: number) => [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
    Buffer.from(JSON.stringify({ sub: user.id, exp: expires })).toString("base64url"),
    "test-signature",
  ].join(".");
  const now = Math.floor(Date.now() / 1000);
  const expired = {
    access_token: jwt(now - 3600), refresh_token: "old-refresh-token",
    expires_at: now - 3600, expires_in: 3600, token_type: "bearer", user,
  };
  const refreshed = {
    access_token: jwt(now + 3600), refresh_token: "new-refresh-token",
    expires_at: now + 3600, expires_in: 3600, token_type: "bearer", user,
  };
  let refreshes = 0;
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const url = String(input);
    assert.ok(url.startsWith("https://session-test.supabase.co/auth/v1/"));
    if (url.includes("/token")) {
      refreshes++;
      return Response.json(refreshed);
    }
    assert.ok(url.includes("/user"));
    return Response.json(user);
  });
  const cookieName = "sb-session-test-auth-token";
  const expiredValue = "base64-" + Buffer.from(JSON.stringify(expired)).toString("base64url");
  const request = new NextRequest("https://www.orientlighting.com.pk/admin/products", {
    method: "POST",
    headers: { cookie: `${cookieName}=${expiredValue}`, "next-action": "test-action" },
  });
  const response = await middleware(request);
  assert.equal(refreshes, 1);
  assert.equal(response.headers.get("location"), null);
  assert.equal(response.headers.get("x-middleware-request-x-orient-admin"), "1");
  const forwarded = response.headers.get("x-middleware-request-cookie")!;
  assert.ok(forwarded);
  assert.notEqual(forwarded, `${cookieName}=${expiredValue}`);
  const value = forwarded.split("=").slice(1).join("=");
  const session = JSON.parse(Buffer.from(value.replace(/^base64-/, ""), "base64url").toString());
  assert.equal(session.access_token, refreshed.access_token);
  assert.equal(session.refresh_token, refreshed.refresh_token);
  assert.equal(response.cookies.get(cookieName)?.value, value);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
});
