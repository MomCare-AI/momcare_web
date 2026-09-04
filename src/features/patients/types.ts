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

export interface PregnancyRiskFactors extends Record<
  RiskFactorField,
  RiskAnswer
> {
  id: string;
  present_factors: RiskFactorField[];
  unanswered_factors: RiskFactorField[];
}

export interface Pregnancy {
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
  assigned_staff: string | null;
  assigned_staff_name: string;
  assigned_staff_is_active: boolean;
  /** False when nobody is assigned OR the assigned clinician has left. Both are
   *  the same silent failure once alerts start routing to a named person. */
  has_responsible_clinician: boolean;
  status: PregnancyStatus;
  status_display: string;
  outcome_date: string | null;
  notes: string;
  risk_factors: PregnancyRiskFactors | null;
  created_at: string;
}

export type CareTeamRole = "nurse" | "provider" | "care_manager";

/** Mirrors CareTeamMembershipSerializer. Additive to Pregnancy.assigned_staff
 *  (the lead clinician) - never a replacement for it. */
export interface CareTeamMembership {
  id: string;
  staff: string;
  staff_name: string;
  role: CareTeamRole;
  role_display: string;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
}

export interface ClinicalNote {
  id: string;
  body: string;
  author_name: string;
  author_role: string;
  created_at: string;
}

export interface Consent {
  id: string;
  status: "granted" | "withdrawn";
  status_display: string;
  recorded_at: string;
  version: string;
  method: string;
  method_display: string;
  recorded_by_name: string;
  note: string;
}

export interface PatientListItem {
  id: string;
  mrn: string | null;
  full_name: string;
  phone: string;
  cnic: string;
  date_of_birth: string | null;
  pregnancy_id: string | null;
  gestational_age_display: string | null;
  pregnancy_status: PregnancyStatus | null;
  /** Null means never assessed — which the list must not render as "stable". */
  risk_level: RiskLevel | null;
  risk_assessed_at: string | null;
  is_active: boolean;
  created_at: string;
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
  has_app_account: boolean;
  location_name: string;
  current_pregnancy: Pregnancy | null;
  consents: Consent[];
  is_active: boolean;
  created_at: string;
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

export interface WorklistResponse {
  count: number;
  results: WorklistPatient[];
}

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/** Clinical state, so it earns colour. Never colour alone — each carries a label. */
export function pregnancyTone(status: PregnancyStatus | null): string {
  if (status === "active") return "stable";
  if (status === "delivered") return "info";
  return "neutral";
}
