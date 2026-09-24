"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authFetch, authJson, SessionExpiredError } from "@/core/api/authFetch";
import type { Paginated } from "@/features/patients/types";
import { portalKeys } from "@/features/portal/hooks/usePortalData";

export interface StaffMember {
  id: string;
  /** The underlying User id — a Staff row and its User are different
   *  records with different ids; this is what a User-referencing field
   *  (e.g. Location.location_manager) needs, never `id` above. */
  user_id: string;
  employee_id: string;
  full_name: string;
  email: string;
  /** Genuinely nullable at runtime — `CharField(default="")` on the
   *  backend only covers a missing key during deserialization, not a User
   *  whose `phone` column is actually NULL in the database. Any consumer
   *  that feeds this into a controlled input must coalesce to `""`. */
  phone: string | null;
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

/** The admin-level counterpart to `StaffProfileInput` — identity, role and
 *  tenant membership, not self-reported credentialing. Every field optional
 *  (a PATCH omitting one leaves it untouched). No `max_patients`/capacity
 *  field here: `StaffUpdateSerializer` doesn't accept one — `Staff.max_patients`
 *  exists on the backend model but isn't exposed on any serializer yet, read
 *  or write. */
export interface StaffUpdateInput {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role_code?: string;
  locations?: string[];
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
    // page_size=100 (the server's max) rather than real pagination — the
    // consumers here are a team roster and role-filtered pickers, and this
    // endpoint's own history called a hospital's staff count "small enough
    // to return in one shot." True for every real hospital today; a
    // hospital that ever exceeds 100 staff needs this to become real
    // pagination, not quietly truncate.
    queryFn: () =>
      authJson<Paginated<StaffMember>>("/api/staff/?page_size=100"),
    select: (data) => data.results,
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

/**
 * Update a staff member's identity, role or locations — the admin-level
 * PATCH (`can_manage_staff`: hospital_admin, or a manager of a location this
 * person is assigned to), same endpoint `useUpdateStaffProfile` hits, a
 * different field set. The server re-validates every rule (email/phone
 * uniqueness, the hospital_admin-promotion escalation guard, locations
 * membership) on every request — this hook only sends what was typed and
 * surfaces whatever field error comes back.
 */
export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      staffId,
      input,
    }: {
      staffId: string;
      input: StaffUpdateInput;
    }) => {
      const form = new FormData();
      if (input.email !== undefined) form.set("email", input.email);
      if (input.first_name !== undefined)
        form.set("first_name", input.first_name);
      if (input.last_name !== undefined) form.set("last_name", input.last_name);
      if (input.phone !== undefined) form.set("phone", input.phone);
      if (input.role_code !== undefined) form.set("role_code", input.role_code);
      if (input.locations !== undefined) {
        for (const id of input.locations) form.append("locations", id);
      }

      const res = await authFetch(`/api/staff/${staffId}/`, {
        method: "PATCH",
        body: form,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          body?.email?.[0] ??
            body?.phone?.[0] ??
            body?.role_code?.[0] ??
            body?.locations?.[0] ??
            body?.detail ??
            "Could not save this staff member."
        );
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
