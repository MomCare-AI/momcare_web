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

/** Accepting an invitation changes the team, and so the shell's staff count. */
export function useInvalidateStaffCount() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: portalKeys.organization });
}
