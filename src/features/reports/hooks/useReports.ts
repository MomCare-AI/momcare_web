"use client";

import { useQuery } from "@tanstack/react-query";

import { SessionExpiredError } from "@/core/api/authFetch";
import { listPatients } from "@/features/patients/api";
import type { PatientListItem } from "@/features/patients/types";

/**
 * Every hook a Reports component needs already exists elsewhere and is
 * reused directly — `useDevices` (features/monitoring), `useStaffList`
 * (features/staff), `useAlerts` (features/alerts), `useWorklist`
 * (features/patients). The one gap: `usePatientList` is deliberately
 * single-page (built for the Patients page's own pager), while a report
 * needs the whole hospital. This is the one new hook Reports adds.
 */

export const reportsKeys = {
  allPatients: ["reports", "all-patients"] as const,
};

function retryUnlessSessionExpired(failureCount: number, error: unknown) {
  if (error instanceof SessionExpiredError) return false;
  return failureCount < 1;
}

/**
 * Every patient at this hospital, across as many pages as it takes.
 *
 * `page_size=100` (the server's own max — DefaultPagination.max_page_size)
 * keeps this to a handful of requests even for a large hospital, fetched
 * sequentially rather than in parallel so a slow first page doesn't fan out
 * into a burst of concurrent requests guessing at total_pages in advance.
 * This is bulk pagination, not the per-record N+1 the Care Team tab
 * explicitly avoids (see the plan) — one request per ~100 patients, not one
 * per patient.
 */
async function fetchAllPatients(): Promise<PatientListItem[]> {
  const first = await listPatients({ pageSize: 100, page: 1 });
  const results = [...first.results];
  for (let page = 2; page <= first.total_pages; page++) {
    const next = await listPatients({ pageSize: 100, page });
    results.push(...next.results);
  }
  return results;
}

export function useAllPatients() {
  return useQuery({
    queryKey: reportsKeys.allPatients,
    queryFn: fetchAllPatients,
    retry: retryUnlessSessionExpired,
    // Reporting data, not a live clock — matches useDashboardSummary's own
    // reasoning for the same staleTime.
    staleTime: 60 * 1000,
  });
}
