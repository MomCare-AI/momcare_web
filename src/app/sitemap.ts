import type { MetadataRoute } from "next";
import { SITE_URL } from "@/core/config/siteUrl";

// Only the pages that are actually indexable. Auth flows (login,
// forgot-password, invite/reset-password links) and the entire portal are
// noindex - listing them here would just tell crawlers to spend budget on
// pages we've told them not to index.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
