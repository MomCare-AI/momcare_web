"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  activateSummaryTemplate,
  createSummaryTemplate,
  deactivateSummaryTemplate,
  enhanceSummaryTemplateWording,
  listSummaryTemplates,
} from "../api";
import type { TemplateSection } from "../types";

export const aiTemplateKeys = {
  all: ["ai-summary-templates"] as const,
};

export function useSummaryTemplates() {
  return useQuery({
    queryKey: aiTemplateKeys.all,
    queryFn: listSummaryTemplates,
    staleTime: 60 * 1000,
  });
}

export function useCreateSummaryTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      sections: TemplateSection[];
      extra_instructions: string;
    }) => createSummaryTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiTemplateKeys.all });
    },
  });
}

export function useActivateSummaryTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => activateSummaryTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiTemplateKeys.all });
    },
  });
}

export function useDeactivateSummaryTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => deactivateSummaryTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiTemplateKeys.all });
    },
  });
}

export function useEnhanceSummaryTemplateWording() {
  return useMutation({
    mutationFn: (input: {
      sections: TemplateSection[];
      extra_instructions: string;
    }) => enhanceSummaryTemplateWording(input),
  });
}
