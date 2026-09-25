import { authFetch, authJson } from "@/core/api/authFetch";
import type {
  ClinicalTagListResponse,
  CombinedMonitoringInput,
  MonitoringNote,
  MonitoringNoteListResponse,
  MonitoringNoteUpdateInput,
  MonitoringSession,
  MonitoringSessionUpdateInput,
  MonitoringTimelineResponse,
} from "./types";

function firstError(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  for (const value of Object.values(record)) {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
  return null;
}

export function getPatientMonitoring(
  patientId: string,
  year?: number,
  month?: number
) {
  const query = new URLSearchParams();
  if (year) query.set("year", String(year));
  if (month) query.set("month", String(month));
  const suffix = query.toString() ? `?${query}` : "";
  return authJson<MonitoringTimelineResponse>(
    `/api/patients/${patientId}/monitoring/${suffix}`
  );
}

export async function logContact(
  patientId: string,
  input: CombinedMonitoringInput
): Promise<{ session: MonitoringSession | null; note: MonitoringNote | null }> {
  const res = await authFetch(`/api/patients/${patientId}/monitoring/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(firstError(body) ?? "Could not log this contact.");
  }
  return body;
}

export async function updateSession(
  sessionId: string,
  input: MonitoringSessionUpdateInput
): Promise<MonitoringSession> {
  const res = await authFetch(`/api/monitoring-sessions/${sessionId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(firstError(body) ?? "Could not save this session.");
  }
  return body as MonitoringSession;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const res = await authFetch(`/api/monitoring-sessions/${sessionId}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(firstError(body) ?? "Could not delete this session.");
  }
}

export async function updateNote(
  noteId: string,
  input: MonitoringNoteUpdateInput
): Promise<MonitoringNote> {
  const res = await authFetch(`/api/monitoring-notes/${noteId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(firstError(body) ?? "Could not save this note.");
  }
  return body as MonitoringNote;
}

export async function deleteNote(noteId: string): Promise<void> {
  const res = await authFetch(`/api/monitoring-notes/${noteId}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(firstError(body) ?? "Could not delete this note.");
  }
}

export function listClinicalTags() {
  return authJson<ClinicalTagListResponse>("/api/clinical-tags/");
}

export function searchPatientNotes(
  patientId: string,
  params: { search?: string; tagId?: string; page?: number }
) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.tagId) query.set("tag_id", params.tagId);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  const suffix = query.toString() ? `?${query}` : "";
  return authJson<MonitoringNoteListResponse>(
    `/api/patients/${patientId}/monitoring/notes/${suffix}`
  );
}
