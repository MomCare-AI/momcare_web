"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SessionExpiredError } from "@/core/api/authFetch";
import {
  addPatientStatus,
  enrolPatient,
  getAISummary,
  getDashboardKpis,
  getPatient,
  getQuickLookupKpis,
  listClinicians,
  listPatients,
  listPatientStatuses,
  listPregnancies,
  listWorklist,
  removePatientStatus,
  updatePatient,
  updatePregnancy,
  type EnrolmentInput,
  type PatientStatusInput,
} from "../api";
import type {
  PatientCareActivityFilter,
  PatientUpdateInput,
  PatientWorkflowFilter,
  PregnancyUpdateInput,
} from "../types";

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
  list: (
    search: string,
    page: number,
    assignedToMe: boolean,
    workflow?: PatientWorkflowFilter,
    careActivity?: PatientCareActivityFilter,
    location?: string | null
  ) =>
    [
      ...patientKeys.all,
      "list",
      { search, page, assignedToMe, workflow, careActivity, location },
    ] as const,
  detail: (id: string) => [...patientKeys.all, "detail", id] as const,
  pregnancies: (id: string) => [...patientKeys.all, "pregnancies", id] as const,
  clinicians: ["clinicians"] as const,
  worklist: (assignedToMe: boolean) =>
    [...patientKeys.all, "worklist", assignedToMe] as const,
  dashboardKpis: ["patients", "dashboard-kpis"] as const,
  quickLookupKpis: ["patients", "quick-lookup-kpis"] as const,
  statuses: (patientId: string) =>
    [...patientKeys.all, "statuses", patientId] as const,
  aiSummary: (patientId: string) =>
    [...patientKeys.all, "ai-summary", patientId] as const,
};

/** An expired session is not a data error — the caller must redirect, not retry. */
function retryUnlessSessionExpired(failureCount: number, error: unknown) {
  if (error instanceof SessionExpiredError) return false;
  return failureCount < 1;
}

export function usePatientList(
  search: string,
  page: number,
  assignedToMe = false,
  pageSize?: number,
  workflow?: PatientWorkflowFilter,
  careActivity?: PatientCareActivityFilter,
  options: { keepPreviousData?: boolean; location?: string | null } = {}
) {
  const { keepPreviousData = true, location = null } = options;
  return useQuery({
    queryKey: [
      ...patientKeys.list(
        search,
        page,
        assignedToMe,
        workflow,
        careActivity,
        location
      ),
      pageSize,
    ],
    queryFn: () =>
      listPatients({
        search,
        page,
        assignedToMe,
        pageSize,
        workflow,
        careActivity,
        location,
      }),
    retry: retryUnlessSessionExpired,
    // Keeps the previous page on screen while the next one loads, so paging
    // and searching don't blank the table on every keystroke. A caller whose
    // key change means "a different list" (the dashboard's workflow tiles)
    // turns this off: the old tile's patients must not stand in for the new
    // tile's while it loads, so that screen shows its skeleton instead.
    placeholderData: keepPreviousData ? (previous) => previous : undefined,
  });
}

/**
 * The worklist — administrative/care-continuity gaps, not clinical
 * severity. Deliberately its own query key and its own endpoint, never
 * merged with the alerts queue's data - see docs/worklist-feature-scope.md.
 */
export function useWorklist(assignedToMe = false) {
  return useQuery({
    queryKey: patientKeys.worklist(assignedToMe),
    queryFn: () => listWorklist(assignedToMe),
    retry: retryUnlessSessionExpired,
  });
}

export function useDashboardKpis(location: string | null = null) {
  return useQuery({
    queryKey: [...patientKeys.dashboardKpis, location ?? "all"],
    queryFn: () => getDashboardKpis(location),
    retry: retryUnlessSessionExpired,
  });
}

/** Organization-wide, uncapped — unlike counting a fetched page of
 *  patients/staff, this never undercounts past a page_size limit. Shared
 *  by Quick Lookup's Patients and Staff tabs; TanStack Query's cache
 *  dedupes the two calls into one request. */
export function useQuickLookupKpis() {
  return useQuery({
    queryKey: patientKeys.quickLookupKpis,
    queryFn: getQuickLookupKpis,
    retry: retryUnlessSessionExpired,
  });
}

export function usePatientStatuses(patientId: string) {
  return useQuery({
    queryKey: patientKeys.statuses(patientId),
    queryFn: () => listPatientStatuses(patientId),
    retry: retryUnlessSessionExpired,
  });
}

export function useAddPatientStatus(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientStatusInput) =>
      addPatientStatus(patientId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: patientKeys.statuses(patientId),
      });
    },
  });
}

export function useRemovePatientStatus(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (statusId: string) => removePatientStatus(statusId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: patientKeys.statuses(patientId),
      });
    },
  });
}

export function useAISummary(patientId: string) {
  return useQuery({
    queryKey: patientKeys.aiSummary(patientId),
    queryFn: () => getAISummary(patientId),
    retry: retryUnlessSessionExpired,
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

export function useUpdatePatient(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PatientUpdateInput) => updatePatient(patientId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: patientKeys.detail(patientId),
      });
    },
  });
}

/** Care team (provider/nurse/care_manager) and every other pregnancy field
 *  are edited through the same endpoint now — there is no separate
 *  care-team mutation. */
export function useUpdatePregnancy(patientId: string, pregnancyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PregnancyUpdateInput) =>
      updatePregnancy(patientId, pregnancyId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: patientKeys.pregnancies(patientId),
      });
      queryClient.invalidateQueries({
        queryKey: patientKeys.detail(patientId),
      });
    },
  });
}
