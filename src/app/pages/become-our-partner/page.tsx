import type { Metadata } from "next";
import { PartnerApplicationForm } from "@/components/partner/PartnerApplicationForm";
import { SITE } from "@/lib/types";

export const metadata: Metadata = {
  title: "Become Our Partner",
  description: `Apply to become an ${SITE.name} distribution partner. Our team reviews applications in order.`,
};

export default function BecomeOurPartnerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">Partnership</p>
      <h1 className="mt-2 font-display text-3xl text-brand-navy sm:text-4xl">Become Our Partner</h1>
      <p className="mt-4 text-base leading-relaxed text-brand-muted">
        Join the {SITE.name} distribution network with {SITE.legalName}. Tell us about your
        business below — we’ll review your application. Questions:{" "}
        <a href={`mailto:${SITE.emailSales}`} className="text-brand hover:underline">
          {SITE.emailSales}
        </a>
        .
      </p>

      <div className="mt-8 rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-8">
        <PartnerApplicationForm />
      </div>
    </div>
  );
}
