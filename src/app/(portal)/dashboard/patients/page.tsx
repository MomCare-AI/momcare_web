"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * The Patients list moved into Clinical Overview (`/dashboard`) — Phase 5.
 * Kept as a redirect rather than deleted so every existing inbound link
 * (patient detail's back-link/breadcrumb, the enrol page's breadcrumb, the
 * navbar search box's old target) keeps working without being touched.
 */
export default function PatientsRedirectPage() {
  const router = useRouter();
  const search = useSearchParams().get("search");

  useEffect(() => {
    router.replace(
      search ? `/dashboard?search=${encodeURIComponent(search)}` : "/dashboard"
    );
  }, [router, search]);

  return null;
}
