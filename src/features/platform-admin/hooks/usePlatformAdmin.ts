"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/portal/hooks/usePortalData";
import { platformAdminRepository as repo } from "../repositories/platformAdminRepository";
import type { ApplicationFilters, HospitalAction, NgoAction } from "../types";

const KEY = ["platform"] as const;

export const useApplications = (filters: ApplicationFilters) =>
  useQuery({
    queryKey: [...KEY, "applications", filters],
    queryFn: () => repo.listApplications(filters),
  });

export const useOrganizations = () =>
  useQuery({
    queryKey: [...KEY, "organizations"],
    queryFn: () => repo.listOrganizations(),
  });

export const useOverview = () =>
  useQuery({
    queryKey: [...KEY, "overview"],
    queryFn: () => repo.getOverview(),
  });

export const useActivity = () =>
  useQuery({
    queryKey: [...KEY, "activity"],
    queryFn: () => repo.listActivity(),
  });

export const usePendingCount = () =>
  useQuery({
    queryKey: [...KEY, "pending-count"],
    queryFn: () => repo.pendingCount(),
  });

export const useHospital = (id: string) =>
  useQuery({
    queryKey: [...KEY, "hospital", id],
    queryFn: () => repo.getHospital(id),
  });

export const useNgo = (id: string) =>
  useQuery({
    queryKey: [...KEY, "ngo", id],
    queryFn: () => repo.getNgo(id),
  });

/** Name recorded as the reviewer on every decision. */
export function useActorName(): string {
  const user = useCurrentUser().data;
  const name = user ? `${user.first_name} ${user.last_name}`.trim() : "";
  return name || "Platform admin";
}

function useRefreshAfter() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useDecideHospital(id: string) {
  const by = useActorName();
  const refresh = useRefreshAfter();
  return useMutation({
    mutationFn: (v: { action: HospitalAction; note: string }) =>
      repo.decideHospital(id, v.action, v.note, by),
    onSuccess: refresh,
  });
}

export function useDecideNgo(id: string) {
  const by = useActorName();
  const refresh = useRefreshAfter();
  return useMutation({
    mutationFn: (v: { action: NgoAction; note: string }) =>
      repo.decideNgo(id, v.action, v.note, by),
    onSuccess: refresh,
  });
}

export function useDecideNgoDocument(id: string) {
  const by = useActorName();
  const refresh = useRefreshAfter();
  return useMutation({
    mutationFn: (v: {
      documentId: string;
      decision: "verified" | "rejected";
      reason: string;
    }) => repo.decideNgoDocument(id, v.documentId, v.decision, v.reason, by),
    onSuccess: refresh,
  });
}

export function useRequestNgoInfo(id: string) {
  const by = useActorName();
  const refresh = useRefreshAfter();
  return useMutation({
    mutationFn: (message: string) => repo.requestNgoInfo(id, message, by),
    onSuccess: refresh,
  });
}
