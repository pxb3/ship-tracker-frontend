import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // produces a self-contained .next/standalone build for a lean Docker image
  output: "standalone",
  // pre-existing lint errors (any-types, generated code, etc.) shouldn't block production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
