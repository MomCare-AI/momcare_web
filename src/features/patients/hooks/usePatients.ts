"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SessionExpiredError } from "@/core/api/authFetch";
import {
  enrolPatient,
  getPatient,
  listClinicians,
  listPatients,
  listPregnancies,
  type EnrolmentInput,
} from "../api";

/**
 * Server data for the patients domain.
 *
 * Per docs/conventions.md, anything coming from Django goes through useQuery
 * rather than hand-rolled useState/useEffect — so caching, refetching and
 * loading/error state are handled in one place instead of being reimplemented
 * on every page.
 */

export const patientKeys = {
  all: ["patients"] as const,
  list: (search: string, page: number) =>
    [...patientKeys.all, "list", { search, page }] as const,
  detail: (id: string) => [...patientKeys.all, "detail", id] as const,
  pregnancies: (id: string) => [...patientKeys.all, "pregnancies", id] as const,
  clinicians: ["clinicians"] as const,
};

/** An expired session is not a data error — the caller must redirect, not retry. */
function retryUnlessSessionExpired(failureCount: number, error: unknown) {
  if (error instanceof SessionExpiredError) return false;
  return failureCount < 1;
}

export function usePatientList(search: string, page: number) {
  return useQuery({
    queryKey: patientKeys.list(search, page),
    queryFn: () => listPatients({ search, page }),
    retry: retryUnlessSessionExpired,
    // Keeps the previous page on screen while the next one loads, so paging
    // and searching don't blank the table on every keystroke.
    placeholderData: (previous) => previous,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => getPatient(id),
    retry: retryUnlessSessionExpired,
  });
}

export function usePregnancies(id: string) {
  return useQuery({
    queryKey: patientKeys.pregnancies(id),
    queryFn: () => listPregnancies(id),
    retry: retryUnlessSessionExpired,
  });
}

export function useClinicians() {
  return useQuery({
    queryKey: patientKeys.clinicians,
    queryFn: listClinicians,
    retry: retryUnlessSessionExpired,
    // The hospital's staff list changes rarely; no need to refetch per visit.
    staleTime: 5 * 60 * 1000,
  });
}

export function useEnrolPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EnrolmentInput) => enrolPatient(input),
    onSuccess: () => {
      // A new patient changes both the list and the dashboard's count.
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });
}
