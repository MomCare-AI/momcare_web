"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { useCurrentUser } from "@/features/portal/hooks/usePortalData";
import { platformAdminRepository as repo } from "../repositories/platformAdminRepository";
import type {
  ApplicationFilters,
  HospitalAction,
  HospitalApplication,
  NgoAction,
  NgoApplication,
  OrgType,
} from "../types";

const KEY = ["platform"] as const;

const detailKey = (type: OrgType, id: string) => [...KEY, type, id] as const;

/**
 * Lists keep showing the previous result while a new filter loads, so
 * switching a tab or typing in the search box never flashes the page back to
 * a skeleton; `isPlaceholderData` lets the screen dim the old rows instead.
 */
export const useApplications = (filters: ApplicationFilters) =>
  useQuery({
    queryKey: [...KEY, "applications", filters],
    queryFn: () => repo.listApplications(filters),
    placeholderData: keepPreviousData,
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
    queryKey: detailKey("hospital", id),
    queryFn: () => repo.getHospital(id),
  });

export const useNgo = (id: string) =>
  useQuery({
    queryKey: detailKey("ngo", id),
    queryFn: () => repo.getNgo(id),
  });

/**
 * Warm the cache for a review page the moment someone points at its row, so
 * the page is already there when they click.
 */
export function usePrefetchApplication() {
  const qc = useQueryClient();
  return (type: OrgType, id: string) => {
    if (type === "hospital") {
      return qc.prefetchQuery({
        queryKey: detailKey("hospital", id),
        queryFn: () => repo.getHospital(id),
        staleTime: 30_000,
      });
    }
    return qc.prefetchQuery({
      queryKey: detailKey("ngo", id),
      queryFn: () => repo.getNgo(id),
      staleTime: 30_000,
    });
  };
}

/** Name recorded as the reviewer on every decision. */
export function useActorName(): string {
  const user = useCurrentUser().data;
  const name = user ? `${user.first_name} ${user.last_name}`.trim() : "";
  return name || "Platform admin";
}

/**
 * After a decision: put the new record straight into the page's cache so the
 * screen updates at once, then refresh everything else (lists, counts,
 * activity) in the background.
 */
function afterDecision(
  qc: QueryClient,
  type: OrgType,
  id: string,
  next: HospitalApplication | NgoApplication
) {
  qc.setQueryData(detailKey(type, id), next);
  return qc.invalidateQueries({
    queryKey: KEY,
    // The detail we just wrote is already current.
    predicate: (q) => q.queryKey.join("/") !== detailKey(type, id).join("/"),
  });
}

export function useDecideHospital(id: string) {
  const by = useActorName();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { action: HospitalAction; note: string }) =>
      repo.decideHospital(id, v.action, v.note, by),
    onSuccess: (next) => afterDecision(qc, "hospital", id, next),
  });
}

export function useDecideNgo(id: string) {
  const by = useActorName();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { action: NgoAction; note: string }) =>
      repo.decideNgo(id, v.action, v.note, by),
    onSuccess: (next) => afterDecision(qc, "ngo", id, next),
  });
}

export function useDecideNgoDocument(id: string) {
  const by = useActorName();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      documentId: string;
      decision: "verified" | "rejected";
      reason: string;
    }) => repo.decideNgoDocument(id, v.documentId, v.decision, v.reason, by),
    onSuccess: (next) => afterDecision(qc, "ngo", id, next),
  });
}

export function useRequestNgoInfo(id: string) {
  const by = useActorName();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => repo.requestNgoInfo(id, message, by),
    onSuccess: (next) => afterDecision(qc, "ngo", id, next),
  });
}
