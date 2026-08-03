import type { Metadata } from "next";
import { SITE, WHATSAPP_URL } from "@/lib/types";

export const metadata: Metadata = {
  title: "Warranty & Claim",
  description: `Warranty support for ${SITE.name}. Contact us on WhatsApp ${SITE.phoneDisplay}.`,
};

const WARRANTY_WHATSAPP = `${WHATSAPP_URL}?text=${encodeURIComponent(
  "Hi Orient Lighting, I need help with a warranty claim.",
)}`;

export default function WarrantyClaimPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">Support</p>
      <h1 className="mt-2 font-display text-3xl text-brand-navy sm:text-4xl">Warranty & Claim</h1>
      <p className="mt-4 text-base leading-relaxed text-brand-muted">
        Orient Lighting LED products are backed by warranty coverage through{" "}
        {SITE.legalName}. If something isn’t right, reach our team on WhatsApp and we’ll help
        you with the claim.
      </p>

      <div className="mt-8 rounded-2xl border border-brand-border bg-brand-ice/40 p-6 sm:p-8">
        <h2 className="font-sans text-lg font-bold text-brand-navy">Contact us on WhatsApp</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-muted">
          Share your product details, purchase proof, and a short description of the issue.
          Our team responds during business hours ({SITE.hours}).
        </p>
        <p className="mt-4 text-sm text-brand-navy">
          WhatsApp:{" "}
          <a
            href={WARRANTY_WHATSAPP}
            className="font-semibold text-brand underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {SITE.phoneDisplay}
          </a>
        </p>
        <a
          href={WARRANTY_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy"
        >
          Chat on WhatsApp
        </a>
      </div>

      <div className="mt-8 space-y-3 text-sm leading-relaxed text-brand-muted">
        <p>
          You can also email{" "}
          <a href={`mailto:${SITE.emailCare}`} className="text-brand hover:underline">
            {SITE.emailCare}
          </a>{" "}
          for warranty support.
        </p>
        <p>
          Keep your invoice or order reference ready — it helps us process claims faster.
        </p>
      </div>
    </div>
  );
}
