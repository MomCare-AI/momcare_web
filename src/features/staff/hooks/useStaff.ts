"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authFetch, authJson, SessionExpiredError } from "@/core/api/authFetch";
import { portalKeys } from "@/features/portal/hooks/usePortalData";

export interface StaffMember {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  role_name: string;
  role_code: string;
  is_user_active: boolean;
  /** False until they've set their own password from the emailed link. */
  has_activated: boolean;
  is_active: boolean;
  photo: string | null;
  qualifications: string;
  specialty: string;
  registration_number: string;
  registration_authority: string;
  practicing_since: string | null;
  /** Derived from practicing_since on every read, never stored - null when
   *  practicing_since hasn't been set. */
  years_of_experience: number | null;
  /** The site(s) this person works at. Required on creation unless
   *  role_code is hospital_admin. */
  location_ids: string[];
  created_at: string;
}

/** What a person may change about their own (or, for an admin, anyone's)
 *  credentialing profile. Never employee_id, role, or tenant membership -
 *  those are granted by the hospital, not self-edited. */
export interface StaffProfileInput {
  photo?: File | null;
  qualifications?: string;
  specialty?: string;
  registration_number?: string;
  registration_authority?: string;
  practicing_since?: string;
}

/** Creates the account directly — passwordless, with a one-time set-password
 *  link emailed to them. There is no separate invite/accept step any more. */
export interface CreateStaffInput {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_code: string;
  /** Required (non-empty) unless role_code is "hospital_admin". */
  locations: string[];
}

export interface AssignmentStatus {
  has_active_patients: boolean;
  active_patient_count: number;
  message: string;
}

export const staffKeys = {
  all: ["staff"] as const,
  list: ["staff", "list"] as const,
  assignmentStatus: (id: string) => ["staff", "assignment-status", id] as const,
};

function retryUnlessSessionExpired(failureCount: number, error: unknown) {
  if (error instanceof SessionExpiredError) return false;
  return failureCount < 1;
}

export function useStaffList() {
  return useQuery({
    queryKey: staffKeys.list,
    queryFn: () => authJson<StaffMember[]>("/api/staff/"),
    retry: retryUnlessSessionExpired,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStaffInput) => {
      const res = await authFetch("/api/staff/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          body?.email?.[0] ??
            body?.locations?.[0] ??
            body?.detail ??
            "Could not create this staff member."
        );
      }
      return body as StaffMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      queryClient.invalidateQueries({ queryKey: portalKeys.organization });
    },
  });
}

/** Checked before deactivating someone, so an admin sees "she still has 4
 *  active patients" before confirming rather than after. */
export function useStaffAssignmentStatus(staffId: string | null) {
  return useQuery({
    queryKey: staffKeys.assignmentStatus(staffId ?? ""),
    queryFn: () =>
      authJson<AssignmentStatus>(`/api/staff/${staffId}/assignment-status/`),
    enabled: staffId !== null,
    retry: retryUnlessSessionExpired,
  });
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      staffId,
      reason,
    }: {
      staffId: string;
      reason?: string;
    }) => {
      const res = await authFetch(`/api/staff/${staffId}/deactivate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason ?? "" }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.detail ?? "Could not deactivate this person.");
      }
      return body as StaffMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list });
    },
  });
}

export function useReactivateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffId: string) => {
      const res = await authFetch(`/api/staff/${staffId}/reactivate/`, {
        method: "POST",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.detail ?? "Could not reactivate this person.");
      }
      return body as StaffMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list });
    },
  });
}

/**
 * Update a staff member's credentialing profile. The server re-checks who
 * may do this on every request (self, or that person's hospital_admin) -
 * this hook doesn't decide who sees the edit form, only sends what's typed.
 */
export function useUpdateStaffProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      staffId,
      input,
    }: {
      staffId: string;
      input: StaffProfileInput;
    }) => {
      const form = new FormData();
      if (input.photo) form.set("photo", input.photo);
      if (input.qualifications !== undefined)
        form.set("qualifications", input.qualifications);
      if (input.specialty !== undefined) form.set("specialty", input.specialty);
      if (input.registration_number !== undefined)
        form.set("registration_number", input.registration_number);
      if (input.registration_authority !== undefined)
        form.set("registration_authority", input.registration_authority);
      if (input.practicing_since !== undefined)
        form.set("practicing_since", input.practicing_since);

      const res = await authFetch(`/api/staff/${staffId}/`, {
        method: "PATCH",
        body: form,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.detail ?? "Could not save this profile.");
      }
      return body as StaffMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list });
    },
  });
}

/** Accepting an invitation changes the team, and so the shell's staff count. */
export function useInvalidateStaffCount() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: portalKeys.organization });
}
