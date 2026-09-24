"use client";

import { useQuery } from "@tanstack/react-query";

import { listLocations } from "../api";

export const locationsKeys = {
  all: ["locations"] as const,
  list: ["locations", "list"] as const,
};

export function useLocations() {
  return useQuery({
    queryKey: locationsKeys.list,
    queryFn: listLocations,
  });
}
