"use client";

/**
 * Local-only note-template store, shared between the Governance "Notes"
 * catalogue (create/edit/delete) and the "Log a contact" form's template
 * picker on a patient's page — no backend exists for this yet (see
 * NoteTemplatesTab.tsx's own docblock), so both surfaces read/write the
 * same localStorage-backed list instead of two disconnected local states.
 * A module-level listener set lets `useNoteTemplates` re-render every
 * subscribed component the moment either surface writes, since the native
 * `storage` event only fires in *other* tabs, never the one that wrote it.
 */

export interface NoteTemplate {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
}

const STORAGE_KEY = "mc-note-templates";
const listeners = new Set<() => void>();

function readFromStorage(): NoteTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NoteTemplate[]) : [];
  } catch {
    return [];
  }
}

let templates: NoteTemplate[] = readFromStorage();

export function getNoteTemplates(): NoteTemplate[] {
  return templates;
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // Storage full/unavailable — the in-memory list still works for this
    // session, which is all this feature ever promised.
  }
  listeners.forEach((l) => l());
}

export function subscribeNoteTemplates(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addNoteTemplate(title: string, body: string) {
  templates = [
    {
      id: crypto.randomUUID(),
      title,
      body,
      updatedAt: new Date().toISOString(),
    },
    ...templates,
  ];
  persist();
}

export function updateNoteTemplate(id: string, title: string, body: string) {
  templates = templates.map((t) =>
    t.id === id ? { ...t, title, body, updatedAt: new Date().toISOString() } : t
  );
  persist();
}

export function deleteNoteTemplate(id: string) {
  templates = templates.filter((t) => t.id !== id);
  persist();
}
