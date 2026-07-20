import { DownloadCatalogue } from "@/components/DownloadCatalogue";
import { MotionLink } from "@/components/motion/Reveal";
import { CompareSteps } from "@/components/landing/CompareSteps";

export function LandingCompareCta() {
  return (
    <section className="relative overflow-hidden bg-brand-navy py-16 text-white sm:py-20">
      <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-brand/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-brand-gold/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Side-by-Side</p>
          <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Compare. Decide.
            <span className="block text-white/90">Buy with confidence.</span>
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">
            Stack Orient Lighting products against each other and see what really sets them apart —
            wattage, specs and value in one clean side-by-side view.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/85">
            <li>• Specs & wattage</li>
            <li>• Application fit</li>
            <li>• Price & value</li>
          </ul>
          <MotionLink
            href="/compare"
            className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand hover:bg-slate-100"
          >
            Start Comparing
          </MotionLink>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <h3 className="font-sans text-2xl font-bold">Not Sure Which Light Is Right?</h3>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Browse by application, download our catalogue, or use product comparison to match the
            right Orient LED to your room, site or project.
          </p>
          <CompareSteps />
          <div className="mt-6 flex flex-wrap gap-3">
            <MotionLink
              href="/collections/best-sellers"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand hover:bg-slate-100"
            >
              Find My Match
            </MotionLink>
            <DownloadCatalogue variant="hero" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingConfidence() {
  return (
    <section className="border-y border-brand-border bg-white py-14">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-2 md:items-center">
        <div>
          <h3 className="font-sans text-2xl font-extrabold text-brand-navy sm:text-3xl">Buy with confidence</h3>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted sm:text-base">
            Nationwide support from Photon Electric Pvt Ltd — every Orient Lighting product is backed
            by warranty coverage and a team that knows LED projects inside out.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <MotionLink
            href="/pages/warranty-claim"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy"
          >
            Warranty & Claim
          </MotionLink>
          <MotionLink
            href="/pages/become-our-partner"
            className="rounded-full border border-brand px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand-off"
          >
            Become a Partner
          </MotionLink>
        </div>
      </div>
    </section>
  );
}

export function LandingStats() {
  const stats = [
    { value: "1996", label: "Lighting Pakistan since" },
    { value: "LED", label: "Full residential to industrial range" },
    { value: "1-Year", label: "Warranty on LED products" },
    { value: "B2B", label: "Trusted by banks, hospitals & campuses" },
  ];
  return (
    <section className="bg-brand py-14 text-white">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <h2 className="font-sans text-3xl font-extrabold tracking-tight sm:text-4xl">Quality Without Compromise</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
          Decades of excellence. Orient Lighting products are specified for homes, commerce and industry
          across Pakistan.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-6">
              <div className="font-sans text-3xl font-extrabold text-white">{s.value}</div>
              <div className="mt-2 text-sm text-white/80">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingSmart() {
  return (
    <section className="bg-brand-off py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Smart Ecosystem</p>
            <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl lg:text-5xl">
              Your Entire Space,
              <span className="block">Brighter by Design</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-brand-muted sm:text-base">
              From smart LED controls to project-ready commercial suites, Orient Lighting helps you
              plan, compare and specify the right fixture — then support it with warranty and local
              expertise.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {["App-Ready Options", "Energy Savings", "Spec Guidance", "Project Support", "Warranty", "Catalogue"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-brand-border bg-white px-3 py-3 text-center text-xs font-semibold text-brand-navy"
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-brand-border bg-brand-navy p-8 text-white sm:p-10">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-gold/20 blur-2xl" />
            <h3 className="relative font-sans text-2xl font-bold">Download the Catalogue</h3>
            <p className="relative mt-3 text-sm text-white/75">
              Specs, ranges and applications — everything you need to plan residential, commercial or
              industrial lighting projects.
            </p>
            <div className="relative mt-6">
              <DownloadCatalogue variant="hero" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
