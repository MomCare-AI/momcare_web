"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SessionExpiredError } from "@/core/api/authFetch";
import {
  assignDevice,
  getAttentionQueue,
  getLatestReadings,
  getRiskHistory,
  listDevices,
  listReadings,
  reassessRisk,
  recordReading,
  registerDevice,
  unassignDevice,
  verifyRisk,
  type ManualReadingInput,
} from "../api";
import type { RiskLevel } from "../types";

// The root is named separately: referring to monitoringKeys inside its own
// initializer makes TypeScript unable to infer the type.
const MONITORING_ROOT = ["monitoring"] as const;

export const monitoringKeys = {
  all: MONITORING_ROOT,
  readings: (pregnancyId: string) =>
    [...MONITORING_ROOT, "readings", pregnancyId] as const,
  latest: (pregnancyId: string) =>
    [...MONITORING_ROOT, "latest", pregnancyId] as const,
  devices: [...MONITORING_ROOT, "devices"] as const,
  risk: (pregnancyId: string) =>
    [...MONITORING_ROOT, "risk", pregnancyId] as const,
  attention: [...MONITORING_ROOT, "attention"] as const,
};

function retryUnlessSessionExpired(failureCount: number, error: unknown) {
  if (error instanceof SessionExpiredError) return false;
  return failureCount < 1;
}

/**
 * Every reading for a pregnancy, newest first.
 *
 * One series feeds the chart and the per-vital summary, because each vital
 * has to be found in whichever event actually measured it. Pair it with
 * useLatestReadings, which answers the different question of whether
 * anything is still arriving at all.
 */
export function useReadings(pregnancyId: string | undefined) {
  return useQuery({
    queryKey: monitoringKeys.readings(pregnancyId ?? ""),
    queryFn: () => listReadings(pregnancyId!),
    enabled: Boolean(pregnancyId),
    retry: retryUnlessSessionExpired,
    // Monitoring data goes out of date on its own, unlike a patient record.
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

/** Anything that changes readings invalidates the chart, risk and the queue. */
function useInvalidateMonitoring(pregnancyId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: monitoringKeys.all });
    queryClient.invalidateQueries({
      queryKey: ["patients", "detail", pregnancyId],
    });
    // A reading can move the risk level, which changes the patient list badge.
    queryClient.invalidateQueries({ queryKey: ["patients"] });
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
    mutationFn: ({
      serialNumber,
      acquisition,
    }: {
      serialNumber: string;
      acquisition?: string;
    }) => registerDevice(serialNumber, acquisition),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: monitoringKeys.devices }),
  });
}

/**
 * When this pregnancy last sent anything at all.
 *
 * Separate from useReadings on purpose — see getLatestReadings. Refetched on
 * a timer because a band going quiet is exactly what this is watching for.
 */
export function useLatestReadings(pregnancyId: string | undefined) {
  return useQuery({
    queryKey: monitoringKeys.latest(pregnancyId ?? ""),
    queryFn: () => getLatestReadings(pregnancyId!),
    enabled: Boolean(pregnancyId),
    retry: retryUnlessSessionExpired,
    staleTime: 30 * 1000,
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

export function useVerifyRisk(pregnancyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      confirmedLevel,
    }: {
      assessmentId: string;
      confirmedLevel: RiskLevel;
    }) => verifyRisk(pregnancyId, assessmentId, confirmedLevel),
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
