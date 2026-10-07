"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SessionExpiredError } from "@/core/api/authFetch";
import * as api from "../api";
import type { CarePlanPreference, PreferenceStatus } from "../types";

export const preferenceKeys = {
  all: ["care-plan-preferences"] as const,
  list: (status: PreferenceStatus) =>
    ["care-plan-preferences", "list", status] as const,
  detail: (id: string) => ["care-plan-preferences", "detail", id] as const,
};

const retryUnlessExpired = (count: number, error: unknown) =>
  !(error instanceof SessionExpiredError) && count < 1;

export function usePreferences(status: PreferenceStatus, enabled = true) {
  return useQuery({
    queryKey: preferenceKeys.list(status),
    queryFn: () => api.listPreferences(status),
    enabled,
    retry: retryUnlessExpired,
  });
}

export function usePreference(id: string | null) {
  return useQuery({
    queryKey: preferenceKeys.detail(id ?? ""),
    queryFn: () => api.getPreference(id!),
    enabled: Boolean(id),
    retry: retryUnlessExpired,
  });
}

/**
 * Every change returns the updated preference: it replaces the cached detail,
 * and the lists are re-fetched because the preference moves between them
 * (suggested -> approved, approved -> inactive, ...).
 */
function usePreferenceWrite<TInput>(
  write: (input: TInput) => Promise<CarePlanPreference>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: write,
    onSuccess: (pref) => {
      queryClient.setQueryData(preferenceKeys.detail(pref.id), pref);
      queryClient.invalidateQueries({
        queryKey: [...preferenceKeys.all, "list"],
      });
    },
  });
}

export function usePreferenceActions() {
  return {
    saveGuidance: usePreferenceWrite((v: { id: string; guidance: string }) =>
      api.updatePreferenceGuidance(v.id, v.guidance)
    ),
    approve: usePreferenceWrite((v: { id: string; guidance?: string }) =>
      api.approvePreference(v.id, v.guidance)
    ),
    reject: usePreferenceWrite((id: string) => api.rejectPreference(id)),
    deactivate: usePreferenceWrite((id: string) =>
      api.deactivatePreference(id)
    ),
  };
}
