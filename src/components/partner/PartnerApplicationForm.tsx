"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import {
  submitPartnerApplication,
  type PartnerFormState,
} from "@/app/actions/partner";
import { SITE } from "@/lib/types";

const initial: PartnerFormState = { ok: false, message: "" };

const inputClass =
  "w-full rounded-md border border-brand-border bg-white px-3 py-2.5 text-sm text-brand-navy outline-none transition focus:border-brand focus:shadow-[0_0_0_3px_rgba(15,66,143,0.12)]";

const SALES_NOTIFY = SITE.emailSales;

async function notifySalesFromBrowser(payload: Record<string, string>) {
  const res = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(SALES_NOTIFY)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        ...payload,
        _captcha: "false",
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`FormSubmit HTTP ${res.status}`);
  }
  const json = (await res.json().catch(() => null)) as {
    success?: string | boolean;
    message?: string;
  } | null;
  if (json && (json.success === false || json.success === "false")) {
    throw new Error(json.message || "FormSubmit rejected");
  }
}

function Field({
  label,
  name,
  error,
  children,
  hint,
}: {
  label: string;
  name: string;
  error?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-brand-navy">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-brand-muted">{hint}</span> : null}
      {error ? (
        <span className="mt-1 block text-xs text-brand-sale" id={`${name}-error`}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function PartnerApplicationForm() {
  const [state, action, pending] = useActionState(submitPartnerApplication, initial);
  const emailedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!state.ok || !state.notifyPayload) return;
    const key = `${state.notifyPayload.email_address}|${state.notifyPayload.company_name}|${state.notifyPayload._subject}`;
    if (emailedRef.current === key) return;
    emailedRef.current = key;

    void notifySalesFromBrowser(state.notifyPayload).catch((err) => {
      console.error("[partner] browser notify failed:", err);
    });
  }, [state]);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-sm text-emerald-900">
        <p className="font-semibold">Application received</p>
        <p className="mt-1">{state.message}</p>
      </div>
    );
  }

  const err = state.fieldErrors || {};

  return (
    <form action={action} className="space-y-5">
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company Name" name="company_name" error={err.company_name}>
          <input name="company_name" required className={inputClass} />
        </Field>
        <Field
          label="Contact Person Name"
          name="contact_person_name"
          error={err.contact_person_name}
        >
          <input name="contact_person_name" required className={inputClass} />
        </Field>
        <Field label="Designation" name="designation" error={err.designation}>
          <input name="designation" required className={inputClass} placeholder="e.g. Owner, Sales Manager" />
        </Field>
        <Field label="Mobile Number" name="mobile_number" error={err.mobile_number}>
          <input name="mobile_number" type="tel" required className={inputClass} placeholder="+92 3XX XXXXXXX" />
        </Field>
        <Field label="Email Address" name="email_address" error={err.email_address}>
          <input name="email_address" type="email" required className={inputClass} />
        </Field>
        <Field label="City" name="city" error={err.city}>
          <input name="city" required className={inputClass} />
        </Field>
        <Field label="Business Type" name="business_type" error={err.business_type}>
          <input
            name="business_type"
            required
            className={inputClass}
            placeholder="e.g. Wholesaler, Retailer, Contractor"
          />
        </Field>
        <Field label="Years in Business" name="years_in_business" error={err.years_in_business}>
          <input name="years_in_business" required className={inputClass} placeholder="e.g. 5" />
        </Field>
      </div>

      <Field
        label="Do you have experience in the LED lighting industry?"
        name="led_experience"
        error={err.led_experience}
      >
        <textarea
          name="led_experience"
          required
          rows={3}
          className={inputClass}
          placeholder="Yes / No — briefly describe your experience"
        />
      </Field>

      <Field
        label="Which areas do you currently serve?"
        name="areas_served"
        error={err.areas_served}
      >
        <textarea
          name="areas_served"
          required
          rows={3}
          className={inputClass}
          placeholder="Cities, regions, or markets you cover"
        />
      </Field>

      <Field
        label="What is your average sales revenue?"
        name="average_sales_revenue"
        error={err.average_sales_revenue}
      >
        <input
          name="average_sales_revenue"
          required
          className={inputClass}
          placeholder="e.g. Monthly / annual estimate"
        />
      </Field>

      <Field
        label="Why do you want to become our distribution partner?"
        name="why_partner"
        error={err.why_partner}
      >
        <textarea name="why_partner" required rows={4} className={inputClass} />
      </Field>

      <Field
        label="Additional Comments (Optional)"
        name="additional_comments"
        error={err.additional_comments}
      >
        <textarea name="additional_comments" rows={3} className={inputClass} />
      </Field>

      {state.message && !state.ok ? (
        <p className="text-sm text-brand-sale">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
