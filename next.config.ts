import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@circle-fin/earn-kit", "@circle-fin/adapter-viem-v2"],
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/assets/fonts/**/*", "./src/assets/arc-logo-light.png"],
    "/twitter-image": ["./src/assets/fonts/**/*", "./src/assets/arc-logo-light.png"],
  },
  async redirects() {
    return [
      { source: "/distributions", destination: "/portfolio", permanent: false },
      { source: "/basket", destination: "/bundles", permanent: false },
    ];
  },
};

export default nextConfig;
