"use client";

import { useActionState } from "react";
import { subscribeNewsletter, type NewsletterState } from "@/app/actions/newsletter";
import { MotionButton } from "@/components/motion/Reveal";

const initial: NewsletterState = { ok: false, message: "" };

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletter, initial);

  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="Email address"
          className="w-full rounded-md border border-brand-border px-3 py-2 text-sm outline-none transition-shadow duration-200 focus:border-brand focus:shadow-[0_0_0_3px_rgba(15,66,143,0.15)]"
        />
        <MotionButton
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy disabled:opacity-60"
        >
          {pending ? "..." : "Join"}
        </MotionButton>
      </div>
      {state.message ? (
        <p className={`text-xs ${state.ok ? "text-green-700" : "text-brand-sale"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
