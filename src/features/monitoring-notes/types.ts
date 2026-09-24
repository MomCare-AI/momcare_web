import type { Paginated } from "@/features/patients/types";

/** Mirrors `core/monitoring/api/serializers.py::ClinicalTagSerializer`. */
export interface ClinicalTag {
  id: string;
  name: string;
  color: string | null;
  organization: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

/** Attach an existing tag (`id`) or get-or-create a new one (`name`+`color`)
 *  — never both, matching `TagSpecSerializer`'s own exactly-one rule. */
export type TagSpec = { id: string } | { name: string; color?: string };

/** Mirrors `MonitoringSessionSerializer`. */
export interface MonitoringSession {
  id: string;
  patient: string;
  patient_name: string;
  mrn: string;
  pregnancy_id: string | null;
  gestational_age: string;
  duration_seconds: number;
  recorded_at: string;
  added_by: string;
  added_by_name: string;
  created_at: string;
  updated_at: string;
}

/** Mirrors `MonitoringNoteSerializer`. */
export interface MonitoringNote {
  id: string;
  patient: string;
  patient_name: string;
  mrn: string;
  pregnancy_id: string | null;
  session_id: string | null;
  note: string;
  recorded_at: string;
  added_by: string;
  added_by_name: string;
  tags: ClinicalTag[];
  left_voicemail: boolean;
  two_way_communication: boolean;
  created_at: string;
  updated_at: string;
}

/** One row in the combined timeline — whichever of session/note it has. A
 *  session with an attached note carries both; a standalone note or a
 *  duration-only session carries just the one. */
export interface TimelineEntry {
  recorded_at: string;
  session: MonitoringSession | null;
  note: MonitoringNote | null;
}

export interface MonitoringTotals {
  total_seconds: number;
  total_formatted: string;
}

export type MonitoringTimelineResponse = Paginated<TimelineEntry> & {
  totals: MonitoringTotals;
  year: number;
  month: number;
};

/** Input for `POST /api/patients/{id}/monitoring/` — creates a session, a
 *  note, or both, atomically. At least one of duration/note is required. */
export interface CombinedMonitoringInput {
  duration_seconds?: number | null;
  recorded_at?: string;
  note?: string;
  tags?: TagSpec[];
  left_voicemail?: boolean;
  two_way_communication?: boolean;
}

export interface MonitoringSessionUpdateInput {
  duration_seconds?: number;
  recorded_at?: string;
}

export interface MonitoringNoteUpdateInput {
  note?: string;
  tags_input?: TagSpec[];
  left_voicemail?: boolean;
  two_way_communication?: boolean;
}

/** `GET /api/clinical-tags/` genuinely returns just `{count, results}` — it
 *  wasn't one of the endpoints Ahmed's pagination fix touched. */
export interface ClinicalTagListResponse {
  count: number;
  results: ClinicalTag[];
}

/** `GET /api/patients/{id}/monitoring/notes/` — standard pagination, notes
 *  only (no sessions, no `totals` — that's a monthly-timeline-only concept). */
export type MonitoringNoteListResponse = Paginated<MonitoringNote>;
