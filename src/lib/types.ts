export type ProductVariant = {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  sku: string;
  available?: boolean;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  images: string[];
  collectionIds: string[];
  variants: ProductVariant[];
  options?: { name: string; values: string[] }[];
  tags?: string[];
  productType?: string;
  vendor?: string;
  seoTitle: string;
  seoDescription: string;
  facets?: { wattage: string[]; colorTemp: string[] };
  publishedAt?: string | null;
};

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: string | null;
  productHandles: string[];
};

export type BlogPost = {
  id: string;
  handle: string;
  title: string;
  excerpt: string;
  body: string;
  publishedAt: string | null;
  image: string | null;
};

export type StaticPage = {
  id: string;
  handle: string;
  title: string;
  body: string;
};

export type Catalog = {
  products: Product[];
  collections: Collection[];
  blogPosts: BlogPost[];
  pages: StaticPage[];
  meta?: Record<string, unknown>;
};

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923001674368";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://orientlighting.com.pk";

export const SITE = {
  name: "Orient Lighting",
  legalName: "Photon Electric Pvt Ltd",
  entity: "ADNAN CORPORATION",
  emailSales: "sales@orientlighting.pk",
  emailCare: "care@orientlighting.pk",
  phoneDisplay: "+92 300 1674368",
  hours: "10AM–7PM Mon–Fri",
  address: "Gate #2, 26km Multan Rd, Maraka Village, Lahore, Punjab 54000",
  darazUrl: "https://www.daraz.pk/shop/orient-lighting/",
  announcement:
    "Online Orders Are Currently Not Available. Kindly Contact us on WhatsApp for Queries.",
};

export const NAV = [
  {
    label: "Residential Lighting",
    href: "/collections/residential-lighting",
    children: [
      { label: "Bulbs", href: "/collections/bulbs" },
      { label: "Down Lights", href: "/collections/downlights" },
      { label: "Battens", href: "/collections/battens-tube-lights" },
      { label: "Panels", href: "/collections/led-recessed-surface-panels" },
    ],
  },
  {
    label: "Commercial Lighting",
    href: "/collections/commercial-lighting",
    children: [
      { label: "Flood Lights", href: "/collections/flood-lights" },
      { label: "High Bay Lights", href: "/collections/highbay-lights" },
      { label: "Street Light", href: "/collections/street-light" },
    ],
  },
  {
    label: "Smart Lights",
    href: "/collections/smart-lights",
  },
] as const;

export const CATEGORY_TILES = [
  { label: "Bulbs", href: "/collections/bulbs", icon: "bulb" },
  { label: "Downlights", href: "/collections/downlights", icon: "down" },
  { label: "Panels", href: "/collections/led-recessed-surface-panels", icon: "panel" },
  { label: "Track Lights", href: "/collections/track-light", icon: "track" },
  { label: "Flood Lights", href: "/collections/flood-lights", icon: "flood" },
  { label: "Spot Lights", href: "/collections/spot-light", icon: "spot" },
  { label: "Street Lights", href: "/collections/street-light", icon: "street" },
  { label: "Battens", href: "/collections/battens-tube-lights", icon: "batten" },
  { label: "Highbay Lights", href: "/collections/highbay-lights", icon: "highbay" },
  { label: "Smart Lights", href: "/collections/smart-lights", icon: "smart" },
] as const;

export const FOOTER_LINKS = [
  { label: "Become Our Partner", href: "/pages/become-our-partner" },
  { label: "Terms & Services", href: "/pages/terms-and-conditions" },
  { label: "Privacy Policy", href: "/pages/privacy-policy" },
  { label: "Return & Exchange", href: "/pages/return-exchange" },
  { label: "Warranty & Claim", href: "/pages/warranty-claim" },
  { label: "Blog", href: "/blogs/orient-lighting" },
] as const;

export const TRUST_BADGES = [
  { title: "Free Shipping", subtitle: "Above Rs. 5,000" },
  { title: "7 Days Refund", subtitle: "Easy returns" },
  { title: "1-Year Warranty", subtitle: "On LED products" },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "Excellent quality LED panels for our office renovation. Bright, efficient, and delivered on time.",
    name: "Ahmed R.",
  },
  {
    quote:
      "We've used Orient flood lights across multiple sites. Reliable performance and great support.",
    name: "Sana K.",
  },
  {
    quote:
      "Professional team and industrial-grade highbays. Highly recommend for commercial projects.",
    name: "Bilal M.",
  },
] as const;

export const CUSTOMER_LOGOS = [
  "Banks",
  "Universities",
  "Hospitals",
  "Telecom",
  "Government",
  "Hotels",
  "Malls",
  "Factories",
] as const;
