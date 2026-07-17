import Link from "next/link";

const promos = [
  {
    title: "Residential Lighting",
    blurb: "Energy-efficient bulbs, downlights, battens and panels for every room.",
    href: "/collections/residential-lighting",
    tone: "from-brand to-brand-navy",
  },
  {
    title: "Commercial Lighting",
    blurb: "Flood lights, highbays and street lights built for demanding spaces.",
    href: "/collections/commercial-lighting",
    tone: "from-brand-navy to-slate-800",
  },
  {
    title: "Industrial Solutions",
    blurb: "High-output LED systems trusted by factories, warehouses and campuses.",
    href: "/collections/highbay-lights",
    tone: "from-slate-800 to-brand",
  },
];

export function PromoBanners() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-4 lg:grid-cols-3">
        {promos.map((promo) => (
          <div
            key={promo.title}
            className={`rounded-xl bg-gradient-to-br ${promo.tone} p-6 text-white shadow-sm`}
          >
            <h3 className="font-display text-2xl">{promo.title}</h3>
            <p className="mt-2 text-sm text-white/85">{promo.blurb}</p>
            <Link
              href={promo.href}
              className="mt-5 inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-slate-100"
            >
              Discover Now
            </Link>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-md bg-white/10 ring-1 ring-white/20" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
