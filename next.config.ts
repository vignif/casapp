import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a smaller runtime by shipping a standalone server
  output: "standalone",
};

export default nextConfig;
