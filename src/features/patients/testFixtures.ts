import type { PatientListItem } from "./types";

/** A patient list row with every required field, for tests. */
export function makePatient(
  overrides: Partial<PatientListItem> = {}
): PatientListItem {
  return {
    id: "p1",
    mrn: null,
    full_name: "Test Patient",
    phone: "",
    cnic: "",
    date_of_birth: null,
    pregnancy_id: null,
    gestational_age_display: null,
    gestational_age_long_display: null,
    pregnancy_status: null,
    risk_latest_level: "not_assessed",
    risk_this_month_level: "not_assessed",
    risk_assessed_at: null,
    pending_risk_count: 0,
    needs_risk_review: false,
    needs_low_confidence_review: false,
    provider_name: null,
    nurse_name: null,
    care_manager_name: null,
    language: null,
    last_reading_at: null,
    last_reading_display: null,
    last_monitoring_contact_at: null,
    last_monitoring_contact_display: null,
    monitoring_seconds_this_month: 0,
    monitoring_time_display: "0m 0s",
    statuses: [],
    is_active: true,
    created_at: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}
