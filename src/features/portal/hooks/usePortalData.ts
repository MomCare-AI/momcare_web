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
}

export const portalKeys = {
  organization: ["organization"] as const,
  currentUser: ["current-user"] as const,
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

/** Refetch the shell's data — used after anything that changes the counts. */
export function useRefreshPortal() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: portalKeys.organization });
    queryClient.invalidateQueries({ queryKey: portalKeys.currentUser });
  };
}
