"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createNoteTemplate,
  deleteNoteTemplate,
  listNoteTemplates,
  updateNoteTemplate,
} from "../api";

export const noteTemplateKeys = {
  all: ["note-templates"] as const,
};

export function useNoteTemplates() {
  return useQuery({
    queryKey: noteTemplateKeys.all,
    queryFn: listNoteTemplates,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateNoteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      content: string;
      organization: string;
    }) => createNoteTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteTemplateKeys.all });
    },
  });
}

export function useUpdateNoteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      input,
    }: {
      templateId: string;
      input: { title?: string; content?: string };
    }) => updateNoteTemplate(templateId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteTemplateKeys.all });
    },
  });
}

export function useDeleteNoteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => deleteNoteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteTemplateKeys.all });
    },
  });
}
