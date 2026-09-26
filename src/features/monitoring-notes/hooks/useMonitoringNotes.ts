"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createClinicalTag,
  deleteNote,
  deleteSession,
  getPatientMonitoring,
  listClinicalTags,
  logContact,
  searchPatientNotes,
  updateNote,
  updateSession,
} from "../api";
import type {
  CombinedMonitoringInput,
  MonitoringNoteUpdateInput,
  MonitoringSessionUpdateInput,
} from "../types";

export const monitoringNotesKeys = {
  all: ["monitoring-notes"] as const,
  timeline: (patientId: string, year?: number, month?: number) =>
    [
      "monitoring-notes",
      "timeline",
      patientId,
      year ?? "current",
      month ?? "current",
    ] as const,
  search: (patientId: string, search: string, tagId: string) =>
    ["monitoring-notes", "search", patientId, search, tagId] as const,
  tags: ["monitoring-notes", "tags"] as const,
};

export function usePatientMonitoring(
  patientId: string,
  year?: number,
  month?: number
) {
  return useQuery({
    queryKey: monitoringNotesKeys.timeline(patientId, year, month),
    queryFn: () => getPatientMonitoring(patientId, year, month),
  });
}

export function useClinicalTags() {
  return useQuery({
    queryKey: monitoringNotesKeys.tags,
    queryFn: listClinicalTags,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateClinicalTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      color?: string | null;
      organization?: string;
      location?: string;
    }) => createClinicalTag(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringNotesKeys.tags });
    },
  });
}

/** Free-text and/or tag-scoped, across every month — a different query from
 *  the timeline, not a filtered view of it. Enabled whenever either a search
 *  term or a tag filter is set; a tag-only filter activates it on its own. */
export function useSearchPatientNotes(
  patientId: string,
  params: { search: string; tagId: string; page?: number }
) {
  return useQuery({
    queryKey: monitoringNotesKeys.search(
      patientId,
      params.search,
      params.tagId
    ),
    queryFn: () =>
      searchPatientNotes(patientId, {
        search: params.search || undefined,
        tagId: params.tagId || undefined,
        page: params.page,
      }),
    enabled: Boolean(params.search.trim() || params.tagId),
  });
}

function useInvalidateTimeline(patientId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: ["monitoring-notes", "timeline", patientId],
    });
    queryClient.invalidateQueries({
      queryKey: ["monitoring-notes", "search", patientId],
    });
  };
}

export function useLogContact(patientId: string) {
  const invalidate = useInvalidateTimeline(patientId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CombinedMonitoringInput) =>
      logContact(patientId, input),
    onSuccess: () => {
      invalidate();
      // A newly typed tag needs to show up in the picker next time too.
      queryClient.invalidateQueries({ queryKey: monitoringNotesKeys.tags });
    },
  });
}

export function useUpdateSession(patientId: string) {
  const invalidate = useInvalidateTimeline(patientId);
  return useMutation({
    mutationFn: ({
      sessionId,
      input,
    }: {
      sessionId: string;
      input: MonitoringSessionUpdateInput;
    }) => updateSession(sessionId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteSession(patientId: string) {
  const invalidate = useInvalidateTimeline(patientId);
  return useMutation({
    mutationFn: (sessionId: string) => deleteSession(sessionId),
    onSuccess: invalidate,
  });
}

export function useUpdateNote(patientId: string) {
  const invalidate = useInvalidateTimeline(patientId);
  return useMutation({
    mutationFn: ({
      noteId,
      input,
    }: {
      noteId: string;
      input: MonitoringNoteUpdateInput;
    }) => updateNote(noteId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteNote(patientId: string) {
  const invalidate = useInvalidateTimeline(patientId);
  return useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId),
    onSuccess: invalidate,
  });
}
