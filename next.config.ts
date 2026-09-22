import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@circle-fin/earn-kit", "@circle-fin/adapter-viem-v2"],
  async headers() {
    return [
      {
        source: "/share.jpg",
        headers: [
          { key: "Content-Type", value: "image/jpeg" },
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/distributions", destination: "/portfolio", permanent: false },
      { source: "/basket", destination: "/bundles", permanent: false },
    ];
  },
};

export default nextConfig;
