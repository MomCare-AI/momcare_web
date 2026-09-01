"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SessionExpiredError } from "@/core/api/authFetch";
import { acknowledgeAlert, getAlert, listAlerts, resolveAlert } from "../api";

const ALERTS_ROOT = ["alerts"] as const;

export const alertKeys = {
  all: ALERTS_ROOT,
  list: (status: string, assignedToMe: boolean) =>
    [...ALERTS_ROOT, "list", status, assignedToMe] as const,
  detail: (id: string) => [...ALERTS_ROOT, "detail", id] as const,
};

function retryUnlessSessionExpired(failureCount: number, error: unknown) {
  if (error instanceof SessionExpiredError) return false;
  return failureCount < 1;
}

/**
 * Live alerts, polled.
 *
 * Alerts arrive without anyone asking, so unlike every other list in the
 * portal this one must refresh itself. Thirty seconds is chosen against the
 * escalation policy: the tightest deadline is five minutes, so a clinician
 * always sees an alert well inside the window they have to answer it.
 */
export function useAlerts(
  status: "live" | "resolved" = "live",
  assignedToMe = false
) {
  return useQuery({
    queryKey: alertKeys.list(status, assignedToMe),
    queryFn: () => listAlerts(status, assignedToMe),
    retry: retryUnlessSessionExpired,
    staleTime: 15 * 1000,
    refetchInterval: status === "live" ? 30 * 1000 : false,
    refetchOnWindowFocus: true,
  });
}

export function useAlert(alertId: string | undefined) {
  return useQuery({
    queryKey: alertKeys.detail(alertId ?? ""),
    queryFn: () => getAlert(alertId!),
    enabled: Boolean(alertId),
    retry: retryUnlessSessionExpired,
  });
}

/** Responding to an alert changes the queue and the risk panel as well. */
function useInvalidateAlerts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: alertKeys.all });
    queryClient.invalidateQueries({ queryKey: ["monitoring"] });
  };
}

export function useAcknowledgeAlert() {
  const invalidate = useInvalidateAlerts();
  return useMutation({
    mutationFn: (alertId: string) => acknowledgeAlert(alertId),
    onSuccess: invalidate,
  });
}

export function useResolveAlert() {
  const invalidate = useInvalidateAlerts();
  return useMutation({
    mutationFn: ({
      alertId,
      resolution,
    }: {
      alertId: string;
      resolution: string;
    }) => resolveAlert(alertId, resolution),
    onSuccess: invalidate,
  });
}
