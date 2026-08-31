import type { MetadataRoute } from "next";
import { SITE_URL } from "@/core/config/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Every authenticated surface, plus the account-action flows whose
      // URLs carry single-use tokens - none of it should be crawled.
      disallow: [
        "/dashboard",
        "/dashboard/*",
        "/login",
        "/forgot-password",
        "/invite/*",
        "/reset-password/*",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
