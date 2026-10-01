"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  activateSummaryTemplate,
  createSummaryTemplate,
  getAIProviderConfig,
  listSummaryTemplates,
  reviewSummaryTemplate,
} from "../api";

export const platformAIKeys = {
  templates: (page: number) =>
    ["platform-ai", "summary-templates", page] as const,
  config: ["platform-ai", "config"] as const,
};

export function useSummaryTemplates(page = 1) {
  return useQuery({
    queryKey: platformAIKeys.templates(page),
    queryFn: () => listSummaryTemplates(page),
  });
}

export function useAIProviderConfig() {
  return useQuery({
    queryKey: platformAIKeys.config,
    queryFn: getAIProviderConfig,
    staleTime: 5 * 60 * 1000,
  });
}

/** Stateless — nothing is saved by calling this, so it isn't invalidated
 *  against anything. A plain mutation purely for its pending/error state. */
export function useReviewSummaryTemplate() {
  return useMutation({
    mutationFn: (content: string) => reviewSummaryTemplate(content),
  });
}

export function useCreateSummaryTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; content: string }) =>
      createSummaryTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["platform-ai", "summary-templates"],
      });
    },
  });
}

export function useActivateSummaryTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => activateSummaryTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["platform-ai", "summary-templates"],
      });
    },
  });
}
