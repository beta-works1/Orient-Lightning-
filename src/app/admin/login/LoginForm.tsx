"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { InlineSpinner } from "@/components/admin/AnimatedLoader";

function safeNext(raw: string | null): string {
  if (!raw) return "/admin/products";
  if (!raw.startsWith("/admin") || raw.startsWith("//") || raw.includes("\\") || raw.includes("@")) {
    return "/admin/products";
  }
  return raw;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    search.get("error") === "unauthorized"
      ? "This account is not authorized for admin access."
      : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signError) {
      setLoading(false);
      // Generic message — do not leak whether email exists
      setError("Invalid email or password.");
      return;
    }

    // Middleware enforces ADMIN_EMAIL + signs out unauthorized sessions
    router.replace(safeNext(search.get("next")));
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-white/25 bg-white/95 p-6 shadow-2xl shadow-black/25 backdrop-blur-md sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0F428F]">
          Orient Lighting
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Manage products — add, edit, or delete.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4" autoComplete="on">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Email</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F428F]"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F428F]"
            />
          </label>
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-[#0F428F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162950] disabled:opacity-60"
          >
            {loading ? (
              <>
                <InlineSpinner className="text-white" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
        <p className="mt-5 text-center text-sm">
          {/* Hard navigation remounts the storefront shell cleanly */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="font-medium text-[#0F428F] hover:underline">
            ← Back to homepage
          </a>
        </p>
      </div>
    </div>
  );
}
