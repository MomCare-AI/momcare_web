"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ngoRepository } from "../repositories/ngoRepository";

export const useNgoBands = () =>
  useQuery({
    queryKey: ["ngo", "bands"],
    queryFn: () => ngoRepository.listBands(),
  });

export const useNgoApplications = () =>
  useQuery({
    queryKey: ["ngo", "applications"],
    queryFn: () => ngoRepository.listApplications(),
  });

export const useNgoBandSummary = () =>
  useQuery({
    queryKey: ["ngo", "band-summary"],
    queryFn: () => ngoRepository.getBandSummary(),
  });

export function useDecideApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: "approved" | "rejected" }) =>
      ngoRepository.decideApplication(v.id, v.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ngo"] }),
  });
}

export function useAllocateBand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) =>
      ngoRepository.allocateBand(applicationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ngo"] }),
  });
}

export function useAddBands() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { batch: string; quantity: number }) =>
      ngoRepository.addBands(v.batch, v.quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ngo"] }),
  });
}

export type BandAction =
  | { kind: "recall"; id: string; reason: string }
  | { kind: "returned"; id: string }
  | { kind: "restock"; id: string }
  | { kind: "retire"; id: string; reason: string };

/** One mutation for every band lifecycle action, so the UI has one error/pending state. */
export function useBandAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: BandAction) => {
      switch (a.kind) {
        case "recall":
          return ngoRepository.requestRecall(a.id, a.reason);
        case "returned":
          return ngoRepository.markReturned(a.id);
        case "restock":
          return ngoRepository.restock(a.id);
        case "retire":
          return ngoRepository.retire(a.id, a.reason);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ngo"] }),
  });
}
