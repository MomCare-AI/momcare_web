import { authFetch, authJson } from "@/core/api/authFetch";
import type { NoteTemplate, NoteTemplateListResponse } from "./types";

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

export function listNoteTemplates() {
  return authJson<NoteTemplateListResponse>("/api/note-templates/");
}

/** V1 scope: organization-level templates only, matching `ClinicalTag`'s and
 *  `StatusLabel`'s own v1 scope — `location` is never sent. */
export async function createNoteTemplate(input: {
  title: string;
  content: string;
  organization: string;
}): Promise<NoteTemplate> {
  const res = await authFetch("/api/note-templates/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(firstError(body) ?? "Could not add this template.");
  }
  return body as NoteTemplate;
}

export async function updateNoteTemplate(
  templateId: string,
  input: { title?: string; content?: string }
): Promise<NoteTemplate> {
  const res = await authFetch(`/api/note-templates/${templateId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(firstError(body) ?? "Could not save this template.");
  }
  return body as NoteTemplate;
}

export async function deleteNoteTemplate(templateId: string): Promise<void> {
  const res = await authFetch(`/api/note-templates/${templateId}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(firstError(body) ?? "Could not remove this template.");
  }
}
