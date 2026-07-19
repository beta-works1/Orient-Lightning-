import Image from "next/image";
import { MotionLink } from "@/components/motion/Reveal";

const FLAGSHIPS = [
  {
    eyebrow: "Residential Flagship",
    title: "LED Panels & Downlights",
    body: "Even, glare-controlled light for living rooms, kitchens and offices. Choose wattage and colour temperature to match every space.",
    tags: ["Energy Efficient", "Multiple CCT", "Easy Install", "1-Year Warranty"],
    href: "/collections/led-recessed-surface-panels",
    secondaryHref: "/collections/downlights",
    secondaryLabel: "View Downlights",
    images: ["/images/promo/residential-1.jpg", "/images/promo/residential-2.jpg"],
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
    images: ["/images/promo/commercial-1.jpg", "/images/promo/commercial-2.jpg"],
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
    images: ["/images/promo/industrial-1.jpg", "/images/promo/industrial-2.jpg"],
    reverse: false,
  },
] as const;

export function LandingFlagships() {
  return (
    <section className="section-space bg-white">
      <div className="mx-auto max-w-7xl space-y-14 px-4 sm:space-y-20">
        {FLAGSHIPS.map((item) => (
          <article
            key={item.title}
            className={`grid items-center gap-8 overflow-hidden rounded-3xl border border-brand-border bg-brand-off lg:grid-cols-2 lg:gap-0 ${
              item.reverse ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div className="grid min-h-[280px] grid-cols-2 grid-rows-2 gap-2 p-2 sm:min-h-[360px] sm:gap-3 sm:p-3">
              <div className="relative row-span-2 overflow-hidden rounded-2xl">
                <Image
                  src={item.images[0]}
                  alt=""
                  fill
                  sizes="(max-width:1024px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="relative overflow-hidden rounded-2xl">
                <Image
                  src={item.images[1]}
                  alt=""
                  fill
                  sizes="(max-width:1024px) 50vw, 25vw"
                  className="object-cover object-center"
                />
              </div>
              <div className="relative overflow-hidden rounded-2xl">
                <Image
                  src={item.images[1]}
                  alt=""
                  fill
                  sizes="(max-width:1024px) 50vw, 25vw"
                  className="object-cover object-bottom"
                />
              </div>
            </div>
            <div className="p-8 sm:p-10 lg:p-12">
              <p className="type-kicker text-brand">{item.eyebrow}</p>
              <h3 className="type-display mt-3 text-[1.75rem] text-brand-navy sm:text-4xl">{item.title}</h3>
              <p className="type-body mt-4 text-brand-muted">{item.body}</p>
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
                <MotionLink
                  href={item.href}
                  className="inline-flex min-h-[44px] cursor-pointer items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-navy"
                >
                  Shop Now
                </MotionLink>
                <MotionLink
                  href={item.secondaryHref}
                  className="inline-flex min-h-[44px] cursor-pointer items-center rounded-full border border-brand/30 px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-white"
                >
                  {item.secondaryLabel}
                </MotionLink>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
