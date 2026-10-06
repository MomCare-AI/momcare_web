import type { MetadataRoute } from "next";
import { SITE_URL } from "@/core/config/siteUrl";

// Only the pages that are actually indexable. Auth flows (login,
// forgot-password, invite/reset-password links) and the entire portal are
// noindex - listing them here would just tell crawlers to spend budget on
// pages we've told them not to index.
// A fixed date, moved by hand when these pages' content really changes. A
// `new Date()` here made every page claim to have changed at every request,
// which search engines learn to ignore.
const LAST_CONTENT_UPDATE = new Date("2026-10-05");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/register`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/register/ngo`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
