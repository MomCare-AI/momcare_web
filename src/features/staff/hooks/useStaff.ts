"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authFetch, authJson, SessionExpiredError } from "@/core/api/authFetch";
import { portalKeys } from "@/features/portal/hooks/usePortalData";

export interface StaffMember {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  role_name: string;
  role_code: string;
  is_user_active: boolean;
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

export interface Invite {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_name: string;
  token: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
}

export interface InviteInput {
  email: string;
  first_name: string;
  last_name: string;
  role_code: string;
}

export const staffKeys = {
  all: ["staff"] as const,
  list: ["staff", "list"] as const,
  invites: ["staff", "invites"] as const,
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

/**
 * Pending invitations — hospital admins only.
 *
 * Clinical staff get a 403 here by design: they may see the team but not
 * manage who joins it. That is an expected answer rather than a failure, so
 * it resolves to an empty list instead of surfacing an error.
 */
export function useInvites(enabled: boolean) {
  return useQuery({
    queryKey: staffKeys.invites,
    queryFn: async () => {
      const res = await authFetch("/api/staff/invites/");
      if (res.status === 403) return [] as Invite[];
      if (!res.ok) throw new Error("Could not load invitations.");
      return (await res.json()) as Invite[];
    },
    enabled,
    retry: retryUnlessSessionExpired,
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InviteInput) => {
      const res = await authFetch("/api/staff/invites/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          body?.email?.[0] ?? body?.detail ?? "Could not create the invitation."
        );
      }
      return body as Invite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      authFetch(`/api/staff/invites/${id}/revoke/`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.invites });
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
