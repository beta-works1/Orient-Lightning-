import { FlagshipParallax } from "@/components/landing/FlagshipParallax";

const FLAGSHIPS = [
  {
    eyebrow: "Residential Flagship",
    title: "LED Panels & Downlights",
    body: "Even, glare-controlled light for living rooms, kitchens and offices. Choose wattage and colour temperature to match every space.",
    tags: ["Energy Efficient", "Multiple CCT", "Easy Install", "1-Year Warranty"],
    href: "/collections/led-recessed-surface-panels",
    secondaryHref: "/collections/downlights",
    secondaryLabel: "View Downlights",
    images: ["/images/promo/residential-1.jpg", "/images/promo/residential-2.jpg"] as const,
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
    images: ["/images/promo/commercial-1.jpg", "/images/promo/commercial-2.jpg"] as const,
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
    images: ["/images/promo/industrial-1.jpg", "/images/promo/industrial-2.jpg"] as const,
    reverse: false,
  },
] as const;

export function LandingFlagships() {
  return (
    <section className="section-space bg-white">
      <div className="mx-auto max-w-7xl space-y-14 px-4 sm:space-y-20">
        {FLAGSHIPS.map((item) => (
          <FlagshipParallax key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
}
