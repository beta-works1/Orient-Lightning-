import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
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
