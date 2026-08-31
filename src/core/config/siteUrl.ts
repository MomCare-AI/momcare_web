/**
 * The canonical production origin, used to build absolute URLs for
 * metadata (canonical links, OG/Twitter tags, sitemap.xml, JSON-LD) that
 * must be correct regardless of what host actually served the request.
 *
 * Defaults to the real production domain rather than failing hard like
 * `API_BASE` does: an SEO tag pointing at the live site is a safe default
 * on a laptop, whereas a wrong API origin would silently break requests.
 * Override with NEXT_PUBLIC_SITE_URL for a staging/preview deployment.
 */
const configured = process.env.NEXT_PUBLIC_SITE_URL;

export const SITE_URL = (configured ?? "https://momcare.solutions").replace(
  /\/+$/,
  ""
);

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
