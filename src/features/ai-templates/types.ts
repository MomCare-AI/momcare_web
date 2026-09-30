/** Mirrors `core.ai.services.TEMPLATE_FIELD_VOCABULARY` on the backend — the
 *  fixed set of fields an AI Summary Template may arrange, and the only
 *  facts the generated summary is ever allowed to state. A template can
 *  rearrange these into labeled sections; it can never add or drop one.
 *  Backend is authoritative — a field added there without being added here
 *  fails template validation loudly (a 400 on save), not silently. */
export const TEMPLATE_FIELD_VOCABULARY = [
  "patient_name",
  "gestational_age",
  "current_risk_level",
  "risk_this_month",
  "latest_readings",
  "thirty_day_average",
  "provider_name",
  "nurse_name",
  "care_manager_name",
  "recent_note",
  "recent_note_author",
  "last_monitoring_contact_display",
  "last_reading_display",
  "monitoring_time_display",
  "active_statuses",
  "pending_risk_count",
  "has_open_alert",
] as const;

export type TemplateField = (typeof TEMPLATE_FIELD_VOCABULARY)[number];

export interface TemplateSection {
  label: string;
  fields: TemplateField[];
}

/** Mirrors `core.ai.api.serializers.AISummaryTemplateSerializer`. Immutable
 *  once created — there is no PATCH; a change means creating a new one and
 *  activating it. At most one active template per organization at a time. */
export interface AISummaryTemplate {
  id: string;
  name: string;
  sections: TemplateSection[];
  extra_instructions: string;
  extra_instructions_word_count: number;
  is_active: boolean;
  activated_at: string | null;
  created_at: string;
  created_by_name: string;
}

export interface AISummaryTemplateListResponse {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
  results: AISummaryTemplate[];
}

export interface TemplateEnhanceResult {
  sections: TemplateSection[];
  extra_instructions: string;
  word_count: number;
  word_limit: number;
  preview_text: string | null;
  /** Only present when the draft was blank — the backend never sends a
   *  blank draft to the AI (nothing to enhance), and returns this plain
   *  notice instead of fabricating a starting point. */
  message?: string;
}
