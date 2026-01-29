import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Disabled to enable API routes for verification
  images: { unoptimized: true },
};

export default nextConfig;
