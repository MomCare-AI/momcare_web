"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SessionExpiredError } from "@/core/api/authFetch";
import {
  addCareTeamMember,
  addClinicalNote,
  endCareTeamMembership,
  enrolPatient,
  getPatient,
  listCareTeam,
  listClinicalNotes,
  listClinicians,
  listPatients,
  listPregnancies,
  listWorklist,
  type EnrolmentInput,
} from "../api";
import type { CareTeamRole } from "../types";

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
  list: (search: string, page: number, assignedToMe: boolean) =>
    [...patientKeys.all, "list", { search, page, assignedToMe }] as const,
  detail: (id: string) => [...patientKeys.all, "detail", id] as const,
  pregnancies: (id: string) => [...patientKeys.all, "pregnancies", id] as const,
  clinicalNotes: (patientId: string, pregnancyId: string) =>
    [...patientKeys.all, "notes", patientId, pregnancyId] as const,
  careTeam: (patientId: string, pregnancyId: string) =>
    [...patientKeys.all, "care-team", patientId, pregnancyId] as const,
  clinicians: ["clinicians"] as const,
  worklist: (assignedToMe: boolean) =>
    [...patientKeys.all, "worklist", assignedToMe] as const,
};

/** An expired session is not a data error — the caller must redirect, not retry. */
function retryUnlessSessionExpired(failureCount: number, error: unknown) {
  if (error instanceof SessionExpiredError) return false;
  return failureCount < 1;
}

export function usePatientList(
  search: string,
  page: number,
  assignedToMe = false
) {
  return useQuery({
    queryKey: patientKeys.list(search, page, assignedToMe),
    queryFn: () => listPatients({ search, page, assignedToMe }),
    retry: retryUnlessSessionExpired,
    // Keeps the previous page on screen while the next one loads, so paging
    // and searching don't blank the table on every keystroke.
    placeholderData: (previous) => previous,
  });
}

/**
 * The worklist — administrative/care-continuity gaps, not clinical
 * severity. Deliberately its own query key and its own endpoint, never
 * merged with the attention queue's data - see
 * docs/worklist-feature-scope.md.
 */
export function useWorklist(assignedToMe = false) {
  return useQuery({
    queryKey: patientKeys.worklist(assignedToMe),
    queryFn: () => listWorklist(assignedToMe),
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

export function useClinicalNotes(patientId: string, pregnancyId: string) {
  return useQuery({
    queryKey: patientKeys.clinicalNotes(patientId, pregnancyId),
    queryFn: () => listClinicalNotes(patientId, pregnancyId),
    retry: retryUnlessSessionExpired,
  });
}

export function useAddClinicalNote(patientId: string, pregnancyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => addClinicalNote(patientId, pregnancyId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: patientKeys.clinicalNotes(patientId, pregnancyId),
      });
    },
  });
}

export function useCareTeam(patientId: string, pregnancyId: string) {
  return useQuery({
    queryKey: patientKeys.careTeam(patientId, pregnancyId),
    queryFn: () => listCareTeam(patientId, pregnancyId),
    // Callers may not know the pregnancy id yet (e.g. before the patient
    // itself has loaded) - calling the hook unconditionally is still
    // required by the rules of hooks, so it just doesn't fire until ready.
    enabled: Boolean(patientId && pregnancyId),
    retry: retryUnlessSessionExpired,
  });
}

export function useAddCareTeamMember(patientId: string, pregnancyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { staff: string; role: CareTeamRole }) =>
      addCareTeamMember(patientId, pregnancyId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: patientKeys.careTeam(patientId, pregnancyId),
      });
    },
  });
}

export function useEndCareTeamMembership(
  patientId: string,
  pregnancyId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (membershipId: string) =>
      endCareTeamMembership(patientId, pregnancyId, membershipId),
    onSuccess: () => {
      // Covers the self-removal case too: if the acting care_manager just
      // ended their own membership, this refetch is what makes the write
      // controls disappear on the next render - canWrite is derived from
      // this same query's data, not cached separately.
      queryClient.invalidateQueries({
        queryKey: patientKeys.careTeam(patientId, pregnancyId),
      });
    },
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
