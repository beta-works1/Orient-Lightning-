"use client";

import {
  useActionState,
  useEffect,
  useRef,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  submitPartnerApplication,
  type PartnerFormState,
} from "@/app/actions/partner";
import { PARTNER_HONEYPOT_FIELD } from "@/lib/partnerFormFields";
import { SITE } from "@/lib/types";

const initial: PartnerFormState = { ok: false, message: "" };

const inputClass =
  "w-full rounded-md border border-brand-border bg-white px-3 py-2.5 text-sm text-brand-navy outline-none transition focus:border-brand focus:shadow-[0_0_0_3px_rgba(15,66,143,0.12)]";

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
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id: name,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy || undefined,
      })
    : children;

  return (
    <div className="block text-sm">
      <label htmlFor={name} className="mb-1.5 block font-medium text-brand-navy">
        {label}
      </label>
      {control}
      {hint ? (
        <span id={hintId} className="mt-1 block text-xs text-brand-muted">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="mt-1 block text-xs text-brand-sale" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function PartnerApplicationForm() {
  const [state, action, pending] = useActionState(submitPartnerApplication, initial);
  const successRef = useRef<HTMLDivElement>(null);
  const errorSummaryRef = useRef<HTMLParagraphElement>(null);

  const showSuccess = state.ok && !state.ignored && Boolean(state.message);

  useEffect(() => {
    if (showSuccess) {
      successRef.current?.focus();
      return;
    }
    if (state.message && !state.ok) {
      errorSummaryRef.current?.focus();
    }
  }, [state, showSuccess]);

  if (showSuccess) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-sm text-emerald-900 outline-none"
      >
        <p className="font-semibold">Application received</p>
        <p className="mt-1">{state.message}</p>
        {state.emailed && state.applicantEmail ? (
          <p className="mt-2 text-emerald-800">
            We’ll follow up at <strong>{state.applicantEmail}</strong> from{" "}
            <a href={`mailto:${SITE.emailSales}`} className="underline">
              {SITE.emailSales}
            </a>
            .
          </p>
        ) : (
          <p className="mt-2 text-emerald-800">
            Questions? Email{" "}
            <a href={`mailto:${SITE.emailSales}`} className="underline">
              {SITE.emailSales}
            </a>
            .
          </p>
        )}
      </div>
    );
  }

  const err = state.fieldErrors || {};

  return (
    <form action={action} className="relative space-y-5" noValidate>
      <div
        className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
        aria-hidden="true"
        inert
      >
        <label>
          Leave this field empty
          <input
            type="text"
            name={PARTNER_HONEYPOT_FIELD}
            tabIndex={-1}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company Name" name="company_name" error={err.company_name}>
          <input
            name="company_name"
            required
            autoComplete="organization"
            className={inputClass}
          />
        </Field>
        <Field
          label="Contact Person Name"
          name="contact_person_name"
          error={err.contact_person_name}
        >
          <input
            name="contact_person_name"
            required
            autoComplete="name"
            className={inputClass}
          />
        </Field>
        <Field label="Designation" name="designation" error={err.designation}>
          <input
            name="designation"
            required
            autoComplete="organization-title"
            className={inputClass}
            placeholder="e.g. Owner, Sales Manager"
          />
        </Field>
        <Field label="Mobile Number" name="mobile_number" error={err.mobile_number}>
          <input
            name="mobile_number"
            type="tel"
            required
            autoComplete="tel"
            className={inputClass}
            placeholder="+92 3XX XXXXXXX"
          />
        </Field>
        <Field label="Email Address" name="email_address" error={err.email_address}>
          <input
            name="email_address"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </Field>
        <Field label="City" name="city" error={err.city}>
          <input name="city" required autoComplete="address-level2" className={inputClass} />
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
        <p
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          className="text-sm text-brand-sale outline-none"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
