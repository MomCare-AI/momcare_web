"use client";

import { usePersistedFlag } from "@/shared/hooks/usePersistedFlag";

/** Remembered NGO sidebar state (per browser), shared across tabs. */
export function useSidebarCollapsed() {
  return usePersistedFlag("momcare_ngo_sidebar_collapsed");
}
