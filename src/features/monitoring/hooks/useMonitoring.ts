"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SessionExpiredError } from "@/core/api/authFetch";
import {
  acknowledgeRisk,
  assignDevice,
  getAttentionQueue,
  getRiskHistory,
  getLatestReadings,
  listDevices,
  listReadings,
  reassessRisk,
  recordReading,
  registerDevice,
  simulateReadings,
  unassignDevice,
  type ManualReadingInput,
} from "../api";
import type { ReadingType } from "../types";

// The root is named separately: referring to monitoringKeys inside its own
// initializer makes TypeScript unable to infer the type.
const MONITORING_ROOT = ["monitoring"] as const;

export const monitoringKeys = {
  all: MONITORING_ROOT,
  latest: (pregnancyId: string) =>
    [...MONITORING_ROOT, "latest", pregnancyId] as const,
  readings: (pregnancyId: string, type?: ReadingType) =>
    [...MONITORING_ROOT, "readings", pregnancyId, type ?? "all"] as const,
  devices: [...MONITORING_ROOT, "devices"] as const,
  risk: (pregnancyId: string) =>
    [...MONITORING_ROOT, "risk", pregnancyId] as const,
  attention: [...MONITORING_ROOT, "attention"] as const,
};

function retryUnlessSessionExpired(failureCount: number, error: unknown) {
  if (error instanceof SessionExpiredError) return false;
  return failureCount < 1;
}

export function useLatestReadings(pregnancyId: string | undefined) {
  return useQuery({
    queryKey: monitoringKeys.latest(pregnancyId ?? ""),
    queryFn: () => getLatestReadings(pregnancyId!),
    enabled: Boolean(pregnancyId),
    retry: retryUnlessSessionExpired,
    // Monitoring data goes out of date on its own, unlike a patient record.
    staleTime: 30 * 1000,
  });
}

export function useReadings(
  pregnancyId: string | undefined,
  type?: ReadingType
) {
  return useQuery({
    queryKey: monitoringKeys.readings(pregnancyId ?? "", type),
    queryFn: () => listReadings(pregnancyId!, { type }),
    enabled: Boolean(pregnancyId),
    retry: retryUnlessSessionExpired,
    staleTime: 30 * 1000,
  });
}

export function useDevices() {
  return useQuery({
    queryKey: monitoringKeys.devices,
    queryFn: listDevices,
    retry: retryUnlessSessionExpired,
  });
}

/** Anything that changes readings invalidates both the chart and the header. */
function useInvalidateMonitoring(pregnancyId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: monitoringKeys.all });
    queryClient.invalidateQueries({
      queryKey: ["patients", "detail", pregnancyId],
    });
  };
}

export function useRecordReading(pregnancyId: string) {
  const invalidate = useInvalidateMonitoring(pregnancyId);
  return useMutation({
    mutationFn: (input: ManualReadingInput) =>
      recordReading(pregnancyId, input),
    onSuccess: invalidate,
  });
}

export function useSimulateReadings(pregnancyId: string) {
  const invalidate = useInvalidateMonitoring(pregnancyId);
  return useMutation({
    mutationFn: (options: { hours: number; elevated: boolean }) =>
      simulateReadings(pregnancyId, options),
    onSuccess: invalidate,
  });
}

export function useAssignDevice(pregnancyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceId,
      acquisition,
    }: {
      deviceId: string;
      acquisition: string;
    }) => assignDevice(pregnancyId, deviceId, acquisition),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringKeys.all });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useUnassignDevice(pregnancyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unassignDevice(pregnancyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringKeys.all });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useRegisterDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serialNumber: string) => registerDevice(serialNumber),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: monitoringKeys.devices }),
  });
}

// ── Risk ────────────────────────────────────────────────────────────────────

export function useRiskHistory(pregnancyId: string | undefined) {
  return useQuery({
    queryKey: monitoringKeys.risk(pregnancyId ?? ""),
    queryFn: () => getRiskHistory(pregnancyId!),
    enabled: Boolean(pregnancyId),
    retry: retryUnlessSessionExpired,
    staleTime: 30 * 1000,
  });
}

/**
 * The queue every clinician's shift starts from.
 *
 * Refetched on window focus and on a timer: this is the one view where a
 * stale screen is a clinical problem rather than an inconvenience.
 */
export function useAttentionQueue() {
  return useQuery({
    queryKey: monitoringKeys.attention,
    queryFn: getAttentionQueue,
    retry: retryUnlessSessionExpired,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useAcknowledgeRisk(pregnancyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: string) =>
      acknowledgeRisk(pregnancyId, assessmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: monitoringKeys.risk(pregnancyId),
      });
      queryClient.invalidateQueries({ queryKey: monitoringKeys.attention });
    },
  });
}

export function useReassessRisk(pregnancyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reassessRisk(pregnancyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: monitoringKeys.risk(pregnancyId),
      });
      queryClient.invalidateQueries({ queryKey: monitoringKeys.attention });
      // A changed level changes the badge on the patient list too.
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
