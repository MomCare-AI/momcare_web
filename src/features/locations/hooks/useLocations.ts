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
    // The endpoint doesn't exist yet, so a 404 will never resolve itself on
    // retry — failing fast avoids redundant requests for an outcome we
    // already know.
    retry: false,
  });
}
