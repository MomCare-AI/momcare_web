/** Mirrors `core.ai.services.TEMPLATE_FIELD_VOCABULARY` — the 17 facts a
 *  summary template's plain-language guidance must cover, judged by the AI
 *  on review, never by a client-side keyword check. Kept here only for
 *  display (e.g. listing what a template should mention); the backend is
 *  the sole judge of coverage. */
export const TEMPLATE_FIELD_LABELS: Record<string, string> = {
  patient_name: "the patient's name",
  gestational_age: "how far along the pregnancy is (gestational age)",
  current_risk_level: "the current risk level (low / medium / high)",
  risk_this_month: "the share of low / medium / high risk this month",
  latest_readings:
    "the latest vital readings (blood pressure, heart rate, temperature, glucose, hemoglobin)",
  thirty_day_average: "the 30-day average of the vitals",
  provider_name: "the provider (doctor) name",
  nurse_name: "the nurse's name",
  care_manager_name: "the care manager's name",
  recent_note: "the most recent clinical note",
  recent_note_author: "who wrote the most recent note",
  last_monitoring_contact_display: "when staff last contacted or monitored her",
  last_reading_display: "when her last reading was received",
  monitoring_time_display: "the monitoring time logged this month",
  active_statuses: "her current statuses",
  pending_risk_count: "how many risk assessments are waiting for review",
  has_open_alert: "whether she has an open alert",
};

/** Mirrors `core.ai.api.serializers.AISummaryTemplateSerializer`. Immutable
 *  once created — there is no PATCH; a change means writing a new one,
 *  which activates automatically and switches the previous one off. At
 *  most one active template platform-wide (not per-hospital — summary
 *  templates became platform-admin only, see backend commit
 *  "make summary templates platform-admin only"). */
export interface AISummaryTemplate {
  id: string;
  name: string;
  content: string;
  word_count: number;
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

/** `POST .../summary-templates/enhance/` — the review step. `complete`
 *  false means the AI judged the draft still misses some of the 17 fields;
 *  nothing else is generated in that case. `complete` true carries the
 *  polished wording and a full sample-data preview, exactly as a patient's
 *  page would render it. Nothing here is saved — review is stateless. */
export interface TemplateReviewResult {
  complete: boolean;
  missing_fields: string[];
  missing_labels: string[];
  message?: string;
  enhanced_content: string | null;
  word_count?: number;
  word_limit?: number;
  preview_text: string | null;
}

/** `GET /api/platform-admin/ai-config/` — read here only for the live word
 *  limit shown while writing a template; editing the model/limit itself is
 *  a separate, not-yet-built console surface. */
export interface AIProviderConfig {
  current_model: string;
  max_words: number;
}
