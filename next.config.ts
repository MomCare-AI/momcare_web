import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js already defaults this to false, but explicit here so a shipped
  // production bundle never leaks source through a stray override.
  productionBrowserSourceMaps: false,
  images: {
    // Staff/organization photos are uploaded to the Django backend and
    // served from its own host - next/image refuses an unlisted remote
    // host outright, so both environments need to be named here.
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "https", hostname: "api.momcare.solutions" },
    ],
    // localhost:8000 resolves to a loopback IP, which the image optimizer's
    // SSRF guard refuses even when remotePatterns allows the hostname -
    // this only matters for local dev, since production's real domain
    // never resolves to a private IP. Scoped to development so the
    // production bundle keeps the guard at full strength.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
