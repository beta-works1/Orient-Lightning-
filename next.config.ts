import type { NextConfig } from "next";

/** React Refresh / webpack HMR need eval in local `next dev` only. */
const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      // Footer Google Maps embed (maps.google.com → www.google.com)
      "frame-src 'self' https://maps.google.com https://www.google.com",
      "object-src 'none'",
      "img-src 'self' data: blob: https://*.supabase.co https://cdn.shopify.com https://orientlighting.com.pk https://*.tile.openstreetmap.org",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      // Dev: 'unsafe-eval' required by Next.js React Refresh. Prod stays strict.
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",
      isDev
        ? "connect-src 'self' ws: wss: https://*.supabase.co wss://*.supabase.co https://*.tile.openstreetmap.org"
        : "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.tile.openstreetmap.org",
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["framer-motion"],
    // Safety net for leftover server-action FormData posts. Browser uploads
    // PUT directly to Supabase via signed URLs (see src/lib/upload/).
    serverActions: {
      bodySizeLimit: "25mb",
    },
    middlewareClientMaxBodySize: "30mb",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    // Product photos already live on the Supabase CDN. Vercel Image Optimization
    // returns 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED) for uncached widths,
    // which shows up as a broken gallery/hero slot while other cached thumbs load.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    qualities: [65, 75, 90],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "drywaizxvygxescnghjr.supabase.co",
      },
      {
        protocol: "https",
        hostname: "orientlighting.com.pk",
      },
    ],
  },
};

export default nextConfig;
