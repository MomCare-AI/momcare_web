"use client";

import { useEffect } from "react";

/**
 * Sets the browser tab title for a client-rendered page.
 *
 * The (portal) route group's pages are all "use client" (they render off
 * live query data, not props Next.js can render server-side), so they
 * can't export a `metadata` object the way the marketing and auth pages
 * do. Portal pages are also noindex - this is purely a UX/tab-clarity
 * fix, not an SEO one.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · MomCare`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
