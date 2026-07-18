import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  {
    title: "Residential",
    blurb: "Bulbs, downlights, battens and panels designed for comfortable, efficient homes.",
    href: "/collections/residential-lighting",
    image: "/images/categories/bulbs-icon.png",
  },
  {
    title: "Commercial",
    blurb: "Flood, highbay and street lighting engineered for offices, retail and campuses.",
    href: "/collections/commercial-lighting",
    image: "/images/categories/flood-lights-icon.png",
  },
  {
    title: "Panels",
    blurb: "Recessed and surface LED panels with even light for offices and interiors.",
    href: "/collections/led-recessed-surface-panels",
    image: "/images/categories/panels-icon.png",
  },
  {
    title: "Downlights",
    blurb: "Clean recessed illumination with colour-temperature options for every space.",
    href: "/collections/downlights",
    image: "/images/categories/downlights-icon.png",
  },
  {
    title: "Outdoor",
    blurb: "Street and flood lights built for long nights and tough Pakistani conditions.",
    href: "/collections/street-light",
    image: "/images/categories/street-lights-icon.png",
  },
  {
    title: "Smart Lights",
    blurb: "Connected lighting for modern homes and intelligent building control.",
    href: "/collections/smart-lights",
    image: "/images/categories/fixtures-icon.png",
  },
] as const;

export function LandingCategories() {
  return (
    <section className="bg-brand-ice py-16 sm:py-20" aria-labelledby="innovation-heading">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Our Range</p>
          <h2
            id="innovation-heading"
            className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-navy sm:text-5xl"
          >
            Illumination for Every Space
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-brand-muted sm:text-base">
            From homes to highways, Orient Lighting brings technologically advanced LED solutions
            designed for Pakistani spaces since 1996.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group flex flex-col rounded-2xl border border-brand-border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-md"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-brand-off">
                <Image src={cat.image} alt="" width={48} height={48} className="h-10 w-10 object-contain" />
              </div>
              <h3 className="font-sans text-xl font-bold text-brand-navy group-hover:text-brand">
                {cat.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-muted">{cat.blurb}</p>
              <span className="mt-5 text-sm font-semibold text-brand">Explore Range →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
