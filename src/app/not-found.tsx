import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">404</p>
      <h1 className="mt-3 font-display text-3xl text-brand-navy sm:text-4xl">Page not found</h1>
      <p className="mt-3 text-sm text-brand-muted">
        That link may be outdated, or the product was removed from the catalogue.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-md bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-navy"
        >
          Back to homepage
        </Link>
        <Link
          href="/collections/best-sellers"
          className="inline-flex min-h-[44px] items-center rounded-md border border-brand-border px-5 text-sm font-medium text-brand-navy hover:bg-slate-50"
        >
          Browse products
        </Link>
      </div>
    </div>
  );
}
