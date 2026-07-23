"use client";

import { useTransition } from "react";
import { deleteProduct } from "@/app/admin/actions";
import { InlineSpinner } from "@/components/admin/AnimatedLoader";

export function DeleteProductButton({ id, title }: { id: string; title: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      onClick={() => {
        if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
        start(async () => {
          await deleteProduct(id);
        });
      }}
    >
      {pending ? (
        <>
          <InlineSpinner className="text-red-600" />
          Deleting…
        </>
      ) : (
        "Delete"
      )}
    </button>
  );
}
