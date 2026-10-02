"use client";

import { useQuery } from "@tanstack/react-query";

import { ngoRepository } from "../repositories/ngoRepository";

export function useNGODashboard() {
  return useQuery({
    queryKey: ["ngo", "dashboard"],
    queryFn: () => ngoRepository.getDashboardSummary(),
  });
}
