import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { FOOTER_LINKS, SITE } from "@/lib/types";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-brand-border bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandLogo variant="footer" />
          <p className="mt-2 text-sm text-brand-muted">{SITE.legalName}</p>
          <p className="mt-1 text-xs text-brand-muted">Legal entity: {SITE.entity}</p>
          <p className="mt-4 text-sm leading-relaxed text-brand-dark">{SITE.address}</p>
          <div className="mt-4 overflow-hidden rounded-md border border-brand-border">
            <iframe
              title="Orient Lighting location"
              src="https://maps.google.com/maps?q=26km%20Multan%20Road%20Maraka%20Lahore&t=&z=14&ie=UTF8&iwloc=&output=embed"
              className="h-40 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div>
          <h3 className="font-display text-lg text-brand-navy">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a className="hover:text-brand" href={`mailto:${SITE.emailSales}`}>
                {SITE.emailSales}
              </a>
            </li>
            <li>
              <a className="hover:text-brand" href={`mailto:${SITE.emailCare}`}>
                {SITE.emailCare}
              </a>
            </li>
            <li>
              <a className="hover:text-brand" href={`tel:${SITE.phoneDisplay.replace(/\s/g, "")}`}>
                {SITE.phoneDisplay}
              </a>
            </li>
            <li className="text-brand-muted">{SITE.hours}</li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg text-brand-navy">Company</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={SITE.darazUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand hover:underline"
              >
                Shop on Daraz
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg text-brand-navy">Stay In Touch</h3>
          <p className="mt-2 text-sm text-brand-muted">
            Promotions, new products and sales. Directly to your inbox.
          </p>
          <div className="mt-4">
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="border-t border-brand-border py-4 text-center text-xs text-brand-muted">
        © {new Date().getFullYear()} {SITE.name}. Operated by {SITE.legalName}. Since 1996.
      </div>
    </footer>
  );
}
