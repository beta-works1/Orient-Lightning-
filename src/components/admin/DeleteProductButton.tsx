"use client";

import { useTransition } from "react";
import { deleteProduct } from "@/app/admin/actions";

export function DeleteProductButton({ id, title }: { id: string; title: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="min-h-[44px] rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      onClick={() => {
        if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
        start(async () => {
          await deleteProduct(id);
        });
      }}
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
