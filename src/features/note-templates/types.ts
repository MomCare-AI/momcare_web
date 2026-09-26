/** Mirrors `core/monitoring/api/serializers.py::NoteTemplateSerializer`.
 *  Reusable canned note text (title + content) a staff member picks while
 *  logging a contact note — a pure content library. Applying one only
 *  copies `content` into the note's own text field client-side; there is
 *  no linkage recorded between a note and the template it came from
 *  (confirmed against the reference implementation — see the backend's own
 *  2026-09-25 note-templates design doc). */
export interface NoteTemplate {
  id: string;
  title: string;
  content: string;
  organization: string | null;
  location: string | null;
  created_by: string | null;
  created_by_name: string;
  updated_by: string | null;
  updated_by_name: string;
  created_at: string;
  updated_at: string;
}

/** `GET /api/note-templates/` — `{count, results}`, not the standard
 *  pagination envelope (same shape as `ClinicalTagListResponse`/
 *  `StatusLabelListResponse`). */
export interface NoteTemplateListResponse {
  count: number;
  results: NoteTemplate[];
}
