import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Serve the standalone marketing landing page at a clean /landing URL.
    return [{ source: "/landing", destination: "/landing.html" }];
  },
};

export default nextConfig;
