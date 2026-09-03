import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // produces a self-contained .next/standalone build for a lean Docker image
  output: "standalone",
};

export default nextConfig;
