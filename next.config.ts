import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // The marketing landing page is the front door (root), and also reachable
    // at /landing. The app itself lives under /start, /path, /learn, etc.
    return [
      { source: "/", destination: "/landing.html" },
      { source: "/landing", destination: "/landing.html" },
    ];
  },
};

export default nextConfig;
