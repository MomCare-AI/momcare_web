"use client";

import { useState } from "react";
import { NotebookPen } from "lucide-react";

import {
  useAddClinicalNote,
  useClinicalNotes,
} from "@/features/patients/hooks/usePatients";

/**
 * A pregnancy's clinical notes — append-only, newest first.
 *
 * Any hospital staff can read (an admin may need one for a liability
 * review), but only a clinician can write one — this is a clinical
 * judgement, not an admin task, same split as acknowledging an alert. The
 * form itself is hidden for a non-clinician rather than shown-then-rejected,
 * since the API would 403 it anyway.
 */
export function ClinicalNotesPanel({
  patientId,
  pregnancyId,
  canWrite,
}: {
  patientId: string;
  pregnancyId: string;
  canWrite: boolean;
}) {
  const notesQuery = useClinicalNotes(patientId, pregnancyId);
  const addNote = useAddClinicalNote(patientId, pregnancyId);
  const [draft, setDraft] = useState("");

  const notes = notesQuery.data ?? [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    addNote.mutate(draft.trim(), {
      onSuccess: () => setDraft(""),
    });
  }

  return (
    <section className="mc-card" style={{ marginTop: 18 }}>
      <div className="mc-card-head">
        <div>
          <div className="mc-card-title">Clinical notes</div>
          <div className="mc-card-sub">
            Append-only — a correction is a new note, never an edit to an old
            one.
          </div>
        </div>
      </div>

      {canWrite && (
        <form
          onSubmit={submit}
          className="mc-card-body"
          style={{ paddingBottom: 0 }}
        >
          <textarea
            className="mc-input"
            rows={3}
            placeholder="Record an observation or decision…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={addNote.isPending}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 10,
            }}
          >
            {addNote.isError && (
              <span className="mc-hint" style={{ color: "var(--c-high)" }}>
                {addNote.error instanceof Error
                  ? addNote.error.message
                  : "Could not save this note."}
              </span>
            )}
            <button
              type="submit"
              className="mc-btn mc-btn-sm"
              disabled={addNote.isPending || !draft.trim()}
            >
              {addNote.isPending ? "Saving…" : "Add note"}
            </button>
          </div>
        </form>
      )}

      <div className="mc-card-body">
        {notesQuery.isError && (
          <div className="mc-hint">Notes could not be loaded.</div>
        )}
        {notesQuery.isSuccess && notes.length === 0 && (
          <div className="mc-empty">
            <span className="mc-empty-icon">
              <NotebookPen size={20} strokeWidth={1.9} aria-hidden />
            </span>
            <span className="mc-empty-title">Nothing recorded yet</span>
            <span className="mc-empty-text">
              {canWrite
                ? "The first note here becomes part of this pregnancy's permanent record."
                : "A clinician has not recorded a note for this pregnancy yet."}
            </span>
          </div>
        )}
        {notes.length > 0 && (
          <ol className="mc-trail">
            {notes.map((note) => (
              <li key={note.id} className="mc-trail-item">
                <span className="mc-trail-dot" aria-hidden />
                <div>
                  <div
                    className="mc-trail-what"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {note.body}
                  </div>
                  <div className="mc-trail-when">
                    {note.author_name || "Unknown"}
                    {note.author_role && ` · ${note.author_role}`}
                    {" · "}
                    {new Date(note.created_at).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
