"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createStatusLabel,
  deleteStatusLabel,
  listStatusLabels,
  updateStatusLabel,
} from "../api";

export const statusKeys = {
  labels: ["status-labels"] as const,
};

export function useStatusLabels() {
  return useQuery({
    queryKey: statusKeys.labels,
    queryFn: listStatusLabels,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateStatusLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      description?: string;
      color?: string | null;
      organization: string;
    }) => createStatusLabel(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statusKeys.labels });
    },
  });
}

export function useUpdateStatusLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      labelId,
      input,
    }: {
      labelId: string;
      input: { name?: string; description?: string; color?: string | null };
    }) => updateStatusLabel(labelId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statusKeys.labels });
    },
  });
}

export function useDeleteStatusLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (labelId: string) => deleteStatusLabel(labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statusKeys.labels });
    },
  });
}
