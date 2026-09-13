import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/distributions", destination: "/portfolio", permanent: false },
      { source: "/basket", destination: "/bundles", permanent: false },
    ];
  },
};

export default nextConfig;
