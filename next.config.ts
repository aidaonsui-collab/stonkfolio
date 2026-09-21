import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@circle-fin/earn-kit", "@circle-fin/adapter-viem-v2"],
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/assets/fonts/**/*"],
    "/twitter-image": ["./src/assets/fonts/**/*"],
  },
  async redirects() {
    return [
      { source: "/distributions", destination: "/portfolio", permanent: false },
      { source: "/basket", destination: "/bundles", permanent: false },
    ];
  },
};

export default nextConfig;
