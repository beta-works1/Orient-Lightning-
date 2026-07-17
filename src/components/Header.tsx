import Link from "next/link";

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="shrink-0">
          <span className="font-display text-xl sm:text-2xl font-semibold tracking-wide text-brand">
            ORIENT
          </span>
          <span className="ml-1 font-sans text-xs sm:text-sm uppercase tracking-[0.2em] text-brand-navy">
            Lighting
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          <div className="group relative">
            <Link
              href="/collections/residential-lighting"
              className="text-sm font-medium text-brand-dark hover:text-brand"
            >
              Residential Lighting
            </Link>
            <div className="invisible absolute left-0 top-full z-50 min-w-[220px] pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
              <div className="rounded-md border border-brand-border bg-white py-2 shadow-lg">
                <Link className="block px-4 py-2 text-sm hover:bg-slate-50" href="/collections/bulbs">
                  Bulbs
                </Link>
                <Link className="block px-4 py-2 text-sm hover:bg-slate-50" href="/collections/downlights">
                  Down Lights
                </Link>
                <Link
                  className="block px-4 py-2 text-sm hover:bg-slate-50"
                  href="/collections/battens-tube-lights"
                >
                  Battens
                </Link>
                <Link
                  className="block px-4 py-2 text-sm hover:bg-slate-50"
                  href="/collections/led-recessed-surface-panels"
                >
                  Panels
                </Link>
              </div>
            </div>
          </div>

          <div className="group relative">
            <Link
              href="/collections/commercial-lighting"
              className="text-sm font-medium text-brand-dark hover:text-brand"
            >
              Commercial Lighting
            </Link>
            <div className="invisible absolute left-0 top-full z-50 min-w-[220px] pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
              <div className="rounded-md border border-brand-border bg-white py-2 shadow-lg">
                <Link className="block px-4 py-2 text-sm hover:bg-slate-50" href="/collections/flood-lights">
                  Flood Lights
                </Link>
                <Link className="block px-4 py-2 text-sm hover:bg-slate-50" href="/collections/highbay-lights">
                  High Bay Lights
                </Link>
                <Link className="block px-4 py-2 text-sm hover:bg-slate-50" href="/collections/street-light">
                  Street Light
                </Link>
              </div>
            </div>
          </div>

          <Link
            href="/collections/smart-lights"
            className="text-sm font-medium text-brand-dark hover:text-brand"
          >
            Smart Lights
          </Link>
        </nav>

        <div className="flex items-center gap-3 text-brand-navy">
          <Link href="/search" aria-label="Search" className="hover:text-brand">
            <IconSearch />
          </Link>
        </div>
      </div>

      <div className="flex lg:hidden gap-3 overflow-x-auto border-t border-brand-border px-4 py-2 text-xs">
        <Link href="/collections/bulbs" className="whitespace-nowrap text-brand-dark">
          Bulbs
        </Link>
        <Link href="/collections/downlights" className="whitespace-nowrap text-brand-dark">
          Downlights
        </Link>
        <Link href="/collections/led-recessed-surface-panels" className="whitespace-nowrap text-brand-dark">
          Panels
        </Link>
        <Link href="/collections/flood-lights" className="whitespace-nowrap text-brand-dark">
          Flood
        </Link>
        <Link href="/collections/smart-lights" className="whitespace-nowrap text-brand-dark">
          Smart
        </Link>
      </div>
    </header>
  );
}
