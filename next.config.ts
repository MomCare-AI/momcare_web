import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// The API's origin, so the browser is allowed to talk to it and nothing else.
// An empty value means same-origin (a proxy rewrite), which 'self' covers.
const apiOrigin = (
  process.env.NEXT_PUBLIC_API_URL ?? (isDev ? "http://localhost:8000" : "")
).replace(/\/+$/, "");

/**
 * Content-Security-Policy.
 *
 * 'unsafe-inline' for scripts and styles stays, because Next.js writes small
 * inline bootstrap scripts and the app sets inline styles; removing it would
 * need per-request nonces. What the policy does still do is the part that
 * matters most for a portal holding patient data: scripts can only come from
 * this site, the page cannot be framed, forms can only post back here, and
 * data can only be sent to this site and the API.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${apiOrigin}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin}${isDev ? " ws: wss:" : ""}`.trim(),
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  // Next.js already defaults this to false, but explicit here so a shipped
  // production bundle never leaks source through a stray override.
  productionBrowserSourceMaps: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
