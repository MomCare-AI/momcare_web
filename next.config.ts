import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js already defaults this to false, but explicit here so a shipped
  // production bundle never leaks source through a stray override.
  productionBrowserSourceMaps: false,
};

export default nextConfig;
