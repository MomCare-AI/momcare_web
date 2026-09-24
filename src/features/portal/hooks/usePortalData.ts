"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authFetch, authJson, SessionExpiredError } from "@/core/api/authFetch";
import type { Paginated } from "@/features/patients/types";

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
  license_number: string;
  /** Read-only — no upload endpoint exists for this yet. */
  license_image: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  status_display: string;
  reviewed_at: string | null;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  /** Derived from country on the server, never stored. null when the risk
   *  model has no training data for that population. */
  region: "asia" | "africa" | "americas" | null;
  region_display: string;
  timezone: string;
  date_format: string;
  established_date: string | null;
  owner_name: string;
  staff_count: number;
  patient_count: number;
  location_count: number;
  /** This hospital's own override, or null when it has never set one. */
  confidence_threshold: string | null;
  /** What scoring actually uses: the override above, or the platform
   *  default when there is none. Always a number, never null. */
  effective_confidence_threshold: string;
  created_at: string;
}

/** The fields a hospital admin may actually edit on their own org profile. */
export interface OrganizationUpdateInput {
  name?: string;
  license_number?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  timezone?: string;
  date_format?: string;
  established_date?: string | null;
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

/** One row from the hospital's own audit trail — every PHI-touching
 *  request, not just the "interesting" ones; callers filter for
 *  noteworthy actions themselves (see dashboard/page.tsx's isNoteworthy). */
export interface AuditLogEntry {
  id: string;
  user_email: string;
  /** Empty when the acting account has since been deactivated. */
  user_name: string;
  action: string;
  action_display: string;
  resource: string;
  resource_id: string;
  ip_address: string;
  endpoint: string;
  timestamp: string;
}

export const portalKeys = {
  organization: ["organization"] as const,
  currentUser: ["current-user"] as const,
  auditLog: ["organization", "audit-log"] as const,
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

/**
 * Editing the hospital's own profile. Region/status/license_image/counts
 * stay server-derived and read-only — see `MyOrganizationView` on the
 * backend for exactly which fields are PATCH-able; this hook only ever
 * sends that set.
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OrganizationUpdateInput) => {
      const res = await authFetch("/api/organization/me/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const firstFieldError = Object.values(body ?? {}).find(
          (v): v is string[] => Array.isArray(v) && typeof v[0] === "string"
        )?.[0];
        throw new Error(
          firstFieldError ?? body?.detail ?? "Could not save these changes."
        );
      }
      return body as OrgSummary;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalKeys.organization });
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: portalKeys.currentUser,
    queryFn: () => authJson<CurrentUser>("/api/auth/me/"),
    retry: retryUnlessSessionExpired,
  });
}

/** The Overview page's activity feed. Replaces the dead
 *  `/api/dashboard/summary/` endpoint's `activity` array — same idea, real
 *  audit-log data instead of a server-side summary that no longer exists. */
export function useAuditLog() {
  return useQuery({
    queryKey: portalKeys.auditLog,
    queryFn: () =>
      authJson<Paginated<AuditLogEntry>>("/api/organization/me/audit-log/"),
    retry: retryUnlessSessionExpired,
    // Not a live clock — reused across a normal page visit rather than
    // refetched on every focus, unlike alerts.
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

/**
 * This hospital's model-confidence threshold.
 *
 * An assessment scoring below it is flagged for a doctor to look again,
 * whatever the risk level. hospital_admin only — the server enforces that
 * too. Passing null clears the override so the hospital follows the platform
 * default live, including any later change to it.
 */
export function useUpdateConfidenceThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threshold: number | null) => {
      const res = await authFetch(
        "/api/organization/me/confidence-threshold/",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confidence_threshold: threshold }),
        }
      );
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          body?.confidence_threshold?.[0] ??
            body?.detail ??
            "Could not save this threshold."
        );
      }
      return body as OrgSummary;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalKeys.organization });
    },
  });
}
