"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { authJson, SessionExpiredError } from "@/core/api/authFetch";

/**
 * The signed-in user and their hospital, fetched once by the portal shell.
 *
 * Held in the query cache rather than component state so that a mutation
 * elsewhere — enrolling a patient, inviting staff — can invalidate it and have
 * the header counts correct without the page knowing how the shell loads.
 */

export interface OrgSummary {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  status_display: string;
  email: string;
  phone: string;
  license_no: string;
  license_authority_display: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  /** Derived from country on the server, never stored. null when the risk
   *  model has no training data for that population. */
  region: "asia" | "africa" | "americas" | null;
  region_display: string;
  owner_name: string;
  staff_count: number;
  patient_count: number;
  location_count: number;
}

export interface CurrentUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_code: string;
  /** Null for platform_admin or a patient - neither has a Staff row. Used to
   *  match "me" against a care-team row's own `staff` id. */
  staff_id: string | null;
}

export interface DashboardRisk {
  critical: number;
  high: number;
  moderate: number;
  stable: number;
  /** Enrolled, but no assessment has ever been written for this pregnancy —
   *  kept apart from "stable" everywhere in this app: a patient nobody has
   *  measured is not a patient who is well. */
  not_assessed: number;
  total: number;
  needing_attention: number;
}

export interface DashboardActivity {
  action: string;
  resource: string;
  /** Empty when the acting account has since been deactivated. */
  actor: string;
  at: string;
}

export interface DashboardSummary {
  risk: DashboardRisk;
  activity: DashboardActivity[];
}

export const portalKeys = {
  organization: ["organization"] as const,
  currentUser: ["current-user"] as const,
  dashboardSummary: ["dashboard-summary"] as const,
};

function retryUnlessSessionExpired(failureCount: number, error: unknown) {
  if (error instanceof SessionExpiredError) return false;
  return failureCount < 1;
}

export function useOrganization() {
  return useQuery({
    queryKey: portalKeys.organization,
    queryFn: () => authJson<OrgSummary>("/api/organization/me/"),
    retry: retryUnlessSessionExpired,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: portalKeys.currentUser,
    queryFn: () => authJson<CurrentUser>("/api/auth/me/"),
    retry: retryUnlessSessionExpired,
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: portalKeys.dashboardSummary,
    queryFn: () => authJson<DashboardSummary>("/api/dashboard/summary/"),
    retry: retryUnlessSessionExpired,
    // Aggregates, not a live clock — reused across a normal page visit rather
    // than refetched on every focus, unlike the attention queue and alerts.
    staleTime: 60 * 1000,
  });
}

/** Refetch the shell's data — used after anything that changes the counts. */
export function useRefreshPortal() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: portalKeys.organization });
    queryClient.invalidateQueries({ queryKey: portalKeys.currentUser });
  };
}
