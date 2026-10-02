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
