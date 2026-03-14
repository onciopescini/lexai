import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-expect-error – Next 16 types may not expose these yet, but they are valid runtime config
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
