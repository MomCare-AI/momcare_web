"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getJoinRequest, listJoinRequests, rejectJoinRequest } from "../api";
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

/** One request, for pre-filling the enrolment form. */
export function useJoinRequest(requestId: string | null) {
  return useQuery({
    queryKey: ["join-requests", "one", requestId],
    queryFn: () => getJoinRequest(requestId as string),
    enabled: Boolean(requestId),
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
