"use client";

import { usePersistedFlag } from "@/shared/hooks/usePersistedFlag";

/** Remembered Platform Admin sidebar state (per browser), shared across tabs. */
export function usePlatformSidebarCollapsed() {
  return usePersistedFlag("momcare_platform_sidebar_collapsed");
}
