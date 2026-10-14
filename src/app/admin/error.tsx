"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error boundary]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-white/30 bg-white/95 p-6 text-center shadow-2xl shadow-black/20">
        <h1 className="text-xl font-bold text-slate-900">The admin page needs to reload</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your saved change may already be complete. Reload the admin panel to fetch the latest
          version and data.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[44px] rounded-md bg-[#0F428F] px-4 text-sm font-semibold text-white hover:bg-[#162950]"
          >
            Reload admin
          </button>
          <button
            type="button"
            onClick={reset}
            className="min-h-[44px] rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
