"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { patientKeys } from "@/features/patients/hooks/usePatients";
import {
  approveJoinRequest,
  listJoinRequests,
  rejectJoinRequest,
} from "../api";
import type { JoinRequestStatus } from "../types";

export const joinRequestsKeys = {
  all: ["join-requests"] as const,
  list: (status?: JoinRequestStatus) =>
    ["join-requests", "list", status ?? "all"] as const,
};

export function useJoinRequests(status?: JoinRequestStatus) {
  return useQuery({
    queryKey: joinRequestsKeys.list(status),
    queryFn: () => listJoinRequests(status),
  });
}

export function useApproveJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, note }: { requestId: string; note?: string }) =>
      approveJoinRequest(requestId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: joinRequestsKeys.all });
      // Approval creates a real Patient — the main list must see it too.
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
    },
  });
}

export function useRejectJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, note }: { requestId: string; note?: string }) =>
      rejectJoinRequest(requestId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: joinRequestsKeys.all });
    },
  });
}
