"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { patientKeys } from "@/features/patients/hooks/usePatients";
import {
  createLocation,
  deactivateLocation,
  getLocationAssignmentStatus,
  listLocations,
  moveLocationPatients,
  reactivateLocation,
  updateLocation,
} from "../api";
import type { LocationCreateInput, LocationUpdateInput } from "../types";

export const locationsKeys = {
  all: ["locations"] as const,
  list: ["locations", "list"] as const,
  assignmentStatus: (id: string) =>
    ["locations", "assignment-status", id] as const,
};

export function useLocations() {
  return useQuery({
    queryKey: locationsKeys.list,
    queryFn: listLocations,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LocationCreateInput) => createLocation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationsKeys.all });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      locationId,
      input,
    }: {
      locationId: string;
      input: LocationUpdateInput;
    }) => updateLocation(locationId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationsKeys.list });
    },
  });
}

/** Checked before deactivating a location, so an admin sees "3 active
 *  patients" before confirming rather than after. */
export function useLocationAssignmentStatus(locationId: string | null) {
  return useQuery({
    queryKey: locationsKeys.assignmentStatus(locationId ?? ""),
    queryFn: () => getLocationAssignmentStatus(locationId as string),
    enabled: locationId !== null,
  });
}

export function useDeactivateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      locationId,
      reason,
    }: {
      locationId: string;
      reason?: string;
    }) => deactivateLocation(locationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationsKeys.list });
    },
  });
}

export function useReactivateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId: string) => reactivateLocation(locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationsKeys.list });
    },
  });
}

export function useMoveLocationPatients() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sourceLocationId,
      targetLocationId,
    }: {
      sourceLocationId: string;
      targetLocationId: string;
    }) => moveLocationPatients(sourceLocationId, targetLocationId),
    onSuccess: (_, { sourceLocationId }) => {
      queryClient.invalidateQueries({ queryKey: locationsKeys.list });
      queryClient.invalidateQueries({
        queryKey: locationsKeys.assignmentStatus(sourceLocationId),
      });
      // A moved patient's location_name and location-scoped visibility both
      // change — the patient list/detail queries would otherwise stay stale.
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
    },
  });
}
