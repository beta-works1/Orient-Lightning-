import Image from "next/image";
import Link from "next/link";

const FLAGSHIPS = [
  {
    eyebrow: "Residential Flagship",
    title: "LED Panels & Downlights",
    body: "Even, glare-controlled light for living rooms, kitchens and offices. Choose wattage and colour temperature to match every space.",
    tags: ["Energy Efficient", "Multiple CCT", "Easy Install", "1-Year Warranty"],
    href: "/collections/led-recessed-surface-panels",
    secondaryHref: "/collections/downlights",
    secondaryLabel: "View Downlights",
    image: "/images/promo/residential-1.jpg",
    reverse: false,
  },
  {
    eyebrow: "Commercial Flagship",
    title: "Flood & Street Lighting",
    body: "High-output outdoor luminaires for compounds, roads and commercial façades — built for reliability across Pakistan.",
    tags: ["IP Rated", "High Lumen", "Durable Build", "Project Ready"],
    href: "/collections/flood-lights",
    secondaryHref: "/collections/street-light",
    secondaryLabel: "View Street Lights",
    image: "/images/promo/commercial-1.jpg",
    reverse: true,
  },
  {
    eyebrow: "Industrial Flagship",
    title: "UFO Highbay Solutions",
    body: "Industrial-grade highbays for warehouses, factories and large halls — powerful illumination with efficient LED technology.",
    tags: ["Highbay", "Wide Coverage", "Industrial Duty", "Long Life"],
    href: "/collections/highbay-lights",
    secondaryHref: "/collections/commercial-lighting",
    secondaryLabel: "View Commercial",
    image: "/images/promo/industrial-1.jpg",
    reverse: false,
  },
] as const;

export function LandingFlagships() {
  return (
    <section className="bg-white py-8 sm:py-12">
      <div className="mx-auto max-w-7xl space-y-10 px-4">
        {FLAGSHIPS.map((item) => (
          <article
            key={item.title}
            className={`grid items-center gap-8 overflow-hidden rounded-3xl border border-brand-border bg-brand-off lg:grid-cols-2 ${
              item.reverse ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div className="relative min-h-[260px] lg:min-h-[360px]">
              <Image src={item.image} alt="" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            </div>
            <div className="p-8 sm:p-10 lg:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">{item.eyebrow}</p>
              <h3 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-brand-muted sm:text-base">{item.body}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-brand/20 bg-white px-3 py-1 text-xs font-medium text-brand"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={item.href}
                  className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy"
                >
                  Shop Now
                </Link>
                <Link
                  href={item.secondaryHref}
                  className="rounded-full border border-brand/30 px-5 py-2.5 text-sm font-semibold text-brand hover:bg-white"
                >
                  {item.secondaryLabel}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
