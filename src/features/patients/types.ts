import type { RiskLevel } from "@/features/monitoring/types";

/** Mirrors the backend serializers in core/patients/api/serializers.py. */

export type RiskAnswer = "yes" | "no" | "unknown";

export type PregnancyStatus =
  | "active"
  | "delivered"
  | "miscarriage"
  | "termination"
  | "stillbirth"
  | "ended_other";

export const RISK_FACTORS = [
  { field: "previous_c_section", label: "Previous C-section" },
  { field: "previous_preeclampsia", label: "Previous preeclampsia" },
  {
    field: "previous_gestational_diabetes",
    label: "Previous gestational diabetes",
  },
  { field: "previous_preterm_birth", label: "Previous preterm birth" },
  { field: "chronic_hypertension", label: "Chronic hypertension" },
  { field: "diabetes", label: "Diabetes" },
  { field: "multiple_pregnancy", label: "Multiple pregnancy" },
] as const;

export type RiskFactorField = (typeof RISK_FACTORS)[number]["field"];

/** The 7 obstetric-history factor fields, flat on `Pregnancy` itself as of
 *  the Sep 2026 backend rebuild — no longer a nested sub-object. */
export type RiskFactors = Record<RiskFactorField, RiskAnswer>;

export interface Pregnancy extends RiskFactors {
  id: string;
  lmp: string | null;
  edd: string | null;
  edd_source: "lmp" | "ultrasound" | "clinical";
  edd_source_display: string;
  edd_confirmed_at: string | null;
  /** Derived from EDD on every read — never stored, so it cannot go stale. */
  gestational_age_weeks: number | null;
  gestational_age_days: number | null;
  gestational_age_display: string;
  gravida: number | null;
  para: number | null;
  /** The accountable lead — what alert escalation actually routes to. */
  provider: string | null;
  provider_name: string;
  provider_is_active: boolean;
  nurse: string | null;
  nurse_name: string;
  care_manager: string | null;
  care_manager_name: string;
  /** False when nobody is assigned as provider OR they've since left. Both are
   *  the same silent failure once alerts start routing to a named person. */
  has_responsible_clinician: boolean;
  status: PregnancyStatus;
  status_display: string;
  outcome_date: string | null;
  notes: string;
  present_factors: RiskFactorField[];
  unanswered_factors: RiskFactorField[];
  created_at: string;
  updated_at: string;
}

/** What `PATCH .../pregnancies/{id}/` accepts — every field optional. */
export type PregnancyUpdateInput = Partial<
  Pick<
    Pregnancy,
    | "lmp"
    | "edd"
    | "edd_source"
    | "gravida"
    | "para"
    | "provider"
    | "nurse"
    | "care_manager"
    | "status"
    | "outcome_date"
    | "notes"
  > &
    RiskFactors
>;

export interface PatientListItem {
  id: string;
  mrn: string | null;
  full_name: string;
  phone: string;
  cnic: string;
  date_of_birth: string | null;
  pregnancy_id: string | null;
  gestational_age_display: string | null;
  /** "7 months 2 weeks 4 days" (a month is 4 weeks). Under one month the
   *  backend sends the short "3w 5d"; formatGestationalAge() normalises it. */
  gestational_age_long_display: string | null;
  pregnancy_status: PregnancyStatus | null;
  /** Newest assessment's level, or "not_assessed" (never null, never a made-up
   *  Low). Replaced `risk_level`; both are read through latestRisk() below so
   *  the list works against a backend on either side of that rename. */
  risk_latest_level?: RiskLevel | "not_assessed";
  /** The month's most common level (ties to the more severe), or
   *  "not_assessed". Absent on a backend that predates it. */
  risk_this_month_level?: RiskLevel | "not_assessed";
  /** @deprecated the old name for risk_latest_level (null = not assessed). */
  risk_level?: RiskLevel | null;
  risk_assessed_at: string | null;
  /** Assessments still waiting for a clinician (high/medium, or low model
   *  confidence); see the risk review workflow. */
  pending_risk_count: number;
  needs_risk_review: boolean;
  needs_low_confidence_review: boolean;
  /** Null when nobody is assigned to that role — render as "—", never blank. */
  provider_name: string | null;
  nurse_name: string | null;
  care_manager_name: string | null;
  /** Only present once she has her own app account — lives on `User`, and
   *  `Patient.user` is optional (a rural patient may never have one). Null
   *  for every patient today, since the patient app isn't live yet. */
  language: string | null;
  last_reading_at: string | null;
  last_reading_display: string | null;
  last_monitoring_contact_at: string | null;
  last_monitoring_contact_display: string | null;
  monitoring_seconds_this_month: number;
  monitoring_time_display: string;
  /** Currently-active custom statuses (the org's own Statuses catalogue,
   *  see governance/components/StatusLabelsTab.tsx) logged on this
   *  patient — each entry carries its own name/description/color, not a
   *  reference back to the catalogue row. */
  statuses: { name: string; description: string; color: string }[];
  is_active: boolean;
  created_at: string;
}

export interface SecondaryProviderBrief {
  id: string;
  name: string;
  email: string;
  phone: string;
  affiliation: string;
}

export interface PatientDetail {
  id: string;
  mrn: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string;
  phone: string;
  cnic: string;
  blood_group: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  emergency_contact_email: string;
  /** Postal address, required at enrolment. Optional here so the page still
   *  works against a backend that predates it. */
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  has_app_account: boolean;
  location_name: string;
  current_pregnancy: Pregnancy | null;
  /** A single date, no longer an append-only log of consent events — see
   *  patients/migrations/0012 on the backend. Optional at onboarding now. */
  consent_date: string | null;
  secondary_provider: string | null;
  secondary_provider_detail: SecondaryProviderBrief | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Just the one field this phase needs to edit post-enrollment — a general
 *  patient-edit form is a separate, unscoped feature. */
export interface PatientUpdateInput {
  secondary_provider?: string | null;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface Paginated<T> {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * One reason a pregnancy is on the worklist — an administrative or
 * care-continuity gap, not a clinical severity signal (that's the
 * Attention Queue's job; the two are deliberately kept apart, see
 * docs/worklist-feature-scope.md). ``days`` is null when the condition is
 * "never happened at all" rather than "happened too long ago".
 */
export interface WorklistReason {
  code:
    | "no_recent_reading"
    | "no_recent_note"
    | "no_risk_history"
    | "no_lead_clinician";
  detail: string;
  days: number | null;
}

export interface WorklistPatient {
  patient_id: string;
  pregnancy_id: string;
  full_name: string;
  gestational_age: string;
  reasons: WorklistReason[];
}

export type WorklistResponse = Paginated<WorklistPatient>;

/**
 * A status logged against a patient at a point in time
 * (`core/monitoring/models.py::PatientStatus`). Free-text `name`/
 * `description`/`color` copied at creation time from the org's Statuses
 * catalogue (`StatusLabel`, see features/statuses) — not a live reference
 * to it, so deleting or editing a catalogue entry never changes a status
 * already logged on a patient. The same name can be logged again later —
 * a status can recur over the months a pregnancy spans.
 */
export interface PatientStatusEntry {
  id: string;
  patient: string;
  patient_name: string;
  pregnancy: string | null;
  name: string;
  description: string;
  color: string;
  added_by: string;
  added_by_name: string;
  created_at: string;
  updated_at: string;
}

export type PatientStatusListResponse = Paginated<PatientStatusEntry>;

/**
 * `GET /api/patients/{id}/ai-summary/` — the cached row only, never
 * generated on demand. There is deliberately no "regenerate" endpoint to
 * call from here; see backend/docs/design/2026-09-27-ai-summary-design.md's
 * Triggers section for the only four paths that ever refresh this.
 */
export interface AISummaryCitation {
  text: string;
  type: "reading" | "staff";
  id: string;
}

export interface AISummary {
  content: string;
  generated_at: string;
  model_used: string;
  citations: AISummaryCitation[];
}

/**
 * The single Dashboard KPIs surface (`GET /api/patients/dashboard-kpis/`) —
 * total/active/inactive roster, pending join requests, and the same
 * risk-review/care-activity conditions the Worklist/Attention Queue filter
 * by, so this can never disagree with what those screens show. Scoped by
 * the same roster filters (location/assigned_to=me) as the patient list.
 */
/** Mirrors `_apply_workflow_and_care_activity`'s accepted `?workflow=`/
 *  `?care_activity=` values on `GET /api/patients/` — the same filter the
 *  dashboard-kpis counts are computed with, so a number on a tile can
 *  never disagree with the list you get by following it. */
export type PatientWorkflowFilter = "risk_review" | "low_confidence";
export type PatientCareActivityFilter =
  "monitoring_follow_up" | "unseen_readings" | "reading_reminder";

export interface DashboardKpis {
  total_patients: number;
  active_patients: number;
  inactive_patients: number;
  pending_join_requests: number;
  workflow: {
    risk_review: number;
    low_confidence: number;
  };
  care_activities: {
    monitoring_follow_up: number;
    unseen_readings: number;
    reading_reminder: number;
  };
}

/** `GET /api/patients/quick-lookup-kpis/` — organization-wide counts, never
 *  scoped by location/`?assigned_to=me` (unlike `DashboardKpis`) and never
 *  capped by a page size, unlike counting a fetched page of results. */
export interface QuickLookupKpis {
  staff: { total: number; active: number; inactive: number };
  patients: { total: number; active: number; inactive: number };
}

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/** Clinical state, so it earns colour. Never colour alone — each carries a label. */
export function pregnancyTone(status: PregnancyStatus | null): string {
  if (status === "active") return "stable";
  if (status === "delivered") return "info";
  return "neutral";
}

/** A patient's latest risk as a level, or null when never assessed. */
export function latestRisk(
  p: Pick<PatientListItem, "risk_latest_level" | "risk_level">
): RiskLevel | null {
  const v = p.risk_latest_level ?? p.risk_level ?? null;
  return v === "not_assessed" ? null : v;
}

/** This month's risk as a level, null when not assessed, undefined when the
 *  backend does not send it at all. */
export function monthRisk(
  p: Pick<PatientListItem, "risk_this_month_level">
): RiskLevel | null | undefined {
  const v = p.risk_this_month_level;
  if (v === undefined) return undefined;
  return v === "not_assessed" ? null : v;
}
