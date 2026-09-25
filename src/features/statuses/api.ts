import { authFetch, authJson } from "@/core/api/authFetch";
import type { StatusLabel, StatusLabelListResponse } from "./types";

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

export function listStatusLabels() {
  return authJson<StatusLabelListResponse>("/api/status-labels/");
}

/** V1 scope: organization-level labels only, matching `ClinicalTag`'s own
 *  v1 scope — `location` is never sent. */
export async function createStatusLabel(input: {
  name: string;
  description?: string;
  color?: string | null;
  organization: string;
}): Promise<StatusLabel> {
  const res = await authFetch("/api/status-labels/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(firstError(body) ?? "Could not add this status.");
  }
  return body as StatusLabel;
}

export async function updateStatusLabel(
  labelId: string,
  input: { name?: string; description?: string; color?: string | null }
): Promise<StatusLabel> {
  const res = await authFetch(`/api/status-labels/${labelId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(firstError(body) ?? "Could not save this status.");
  }
  return body as StatusLabel;
}

export async function deleteStatusLabel(labelId: string): Promise<void> {
  const res = await authFetch(`/api/status-labels/${labelId}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(firstError(body) ?? "Could not remove this status.");
  }
}
