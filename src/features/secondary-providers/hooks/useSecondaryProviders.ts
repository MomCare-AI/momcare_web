"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSecondaryProvider,
  deleteSecondaryProvider,
  listSecondaryProviders,
  updateSecondaryProvider,
} from "../api";
import type { SecondaryProviderInput } from "../types";

export const secondaryProvidersKeys = {
  all: ["secondary-providers"] as const,
  list: (search?: string) =>
    ["secondary-providers", "list", search ?? ""] as const,
};

export function useSecondaryProviders(search?: string) {
  return useQuery({
    queryKey: secondaryProvidersKeys.list(search),
    queryFn: () => listSecondaryProviders(search),
  });
}

export function useCreateSecondaryProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SecondaryProviderInput) =>
      createSecondaryProvider(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: secondaryProvidersKeys.all });
    },
  });
}

export function useUpdateSecondaryProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      providerId,
      input,
    }: {
      providerId: string;
      input: SecondaryProviderInput;
    }) => updateSecondaryProvider(providerId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: secondaryProvidersKeys.all });
    },
  });
}

export function useDeleteSecondaryProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (providerId: string) => deleteSecondaryProvider(providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: secondaryProvidersKeys.all });
    },
  });
}
