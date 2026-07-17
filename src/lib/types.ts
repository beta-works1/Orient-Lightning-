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
  announcement: "Free shipping on orders above Rs. 5,000 · 1-year warranty on LED products",
  catalogueUrl: "/orient-lighting-catalogue.pdf",
  catalogueFilename: "Orient-Lighting-Catalogue.pdf",
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
  {
    label: "Bulbs",
    href: "/collections/bulbs",
    image: "/images/categories/bulbs-icon.png",
  },
  {
    label: "Downlights",
    href: "/collections/downlights",
    image: "/images/categories/downlights-icon.png",
  },
  {
    label: "Panels",
    href: "/collections/led-recessed-surface-panels",
    image: "/images/categories/panels-icon.png",
  },
  {
    label: "Track Lights",
    href: "/collections/track-light",
    image: "/images/categories/track-lights-icon.png",
  },
  {
    label: "Flood Lights",
    href: "/collections/flood-lights",
    image: "/images/categories/flood-lights-icon.png",
  },
  {
    label: "Spot Lights",
    href: "/collections/spot-light",
    image: "/images/categories/spot-lights-icon.png",
  },
  {
    label: "Street Lights",
    href: "/collections/street-light",
    image: "/images/categories/street-lights-icon.png",
  },
  {
    label: "Lamps",
    href: "/collections/led-bulbs",
    image: "/images/categories/lamps-icon.png",
  },
  {
    label: "Battens",
    href: "/collections/battens-tube-lights",
    image: "/images/categories/battens-icon.png",
  },
  {
    label: "Highbay Lights",
    href: "/collections/highbay-lights",
    image: "/images/categories/highbay-lights-icon.png",
  },
  {
    label: "Fixtures",
    href: "/collections/residential-lighting",
    image: "/images/categories/fixtures-icon.png",
  },
  {
    label: "Wall Lights",
    href: "/collections/spot-light",
    image: "/images/categories/wall-lights-icon.png",
  },
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
  { name: "Bahria Town", src: "/images/clients/client-bahria-town.png" },
  { name: "City Government Lahore", src: "/images/clients/client-city-govt-lahore.png" },
  { name: "Coca-Cola", src: "/images/clients/client-cocacola.png" },
  { name: "DHA Lahore", src: "/images/clients/client-dha-lhr.png" },
  { name: "HBL", src: "/images/clients/client-hbl.png" },
  { name: "Hyperstar", src: "/images/clients/client-hyperstar.png" },
  { name: "Jinnah Hospital", src: "/images/clients/client-jinnah-hospital.png" },
  { name: "Kashf", src: "/images/clients/client-kashf.png" },
  { name: "KNN", src: "/images/clients/client-knn.png" },
  { name: "LDA", src: "/images/clients/client-lda.png" },
  { name: "Leads University", src: "/images/clients/client-leads-uni.png" },
  { name: "Lahore Gymkhana", src: "/images/clients/client-lhr-gymkhana.png" },
  { name: "Metro", src: "/images/clients/client-metro.png" },
  { name: "Mobilink", src: "/images/clients/client-mobilink.png" },
  { name: "Pakistan Army", src: "/images/clients/client-pak-army.png" },
  { name: "Pearl Continental", src: "/images/clients/client-pc.png" },
  { name: "Punjab College", src: "/images/clients/client-punjab-college.png" },
  { name: "SA Gardens", src: "/images/clients/client-sa-gardens.png" },
  { name: "Saif Care", src: "/images/clients/client-saif-care.png" },
  { name: "Serena", src: "/images/clients/client-serena.png" },
  { name: "Sialkot International Airport", src: "/images/clients/client-sialkot-int-airport.png" },
  { name: "UCP", src: "/images/clients/client-ucp.png" },
  { name: "UMT", src: "/images/clients/client-umt.png" },
  { name: "Warid", src: "/images/clients/client-warid.png" },
  { name: "Wateen", src: "/images/clients/client-wateen.png" },
] as const;
