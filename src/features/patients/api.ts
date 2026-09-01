import { authFetch, authJson } from "@/core/api/authFetch";

import type {
  ClinicalNote,
  Paginated,
  PatientDetail,
  PatientListItem,
  Pregnancy,
  RiskAnswer,
} from "./types";

export interface EnrolmentInput {
  first_name: string;
  last_name?: string;
  date_of_birth?: string | null;
  gender?: string;
  phone?: string;
  cnic?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  pregnancy?: {
    lmp?: string | null;
    edd?: string | null;
    edd_source?: string;
    gravida?: number | null;
    para?: number | null;
    assigned_staff?: string | null;
    notes?: string;
    risk_factors?: Record<string, RiskAnswer>;
  };
  consent: {
    status: "granted";
    version: string;
    method: string;
    note?: string;
  };
}

export function listPatients(
  params: { search?: string; page?: number; assignedToMe?: boolean } = {}
) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  // Backed by CareTeamMembership + Pregnancy.assigned_staff on the server —
  // see core/patients/api/views.py:_scope_to_assigned. hospital_admin gets an
  // honest empty list for this param, so it's never sent for that role.
  if (params.assignedToMe) query.set("assigned_to", "me");
  const suffix = query.toString() ? `?${query}` : "";
  return authJson<Paginated<PatientListItem>>(`/api/patients/${suffix}`);
}

export function getPatient(id: string) {
  return authJson<PatientDetail>(`/api/patients/${id}/`);
}

export function listPregnancies(patientId: string) {
  return authJson<Pregnancy[]>(`/api/patients/${patientId}/pregnancies/`);
}

export function listClinicalNotes(patientId: string, pregnancyId: string) {
  return authJson<ClinicalNote[]>(
    `/api/patients/${patientId}/pregnancies/${pregnancyId}/notes/`
  );
}

/**
 * Write a clinical note. The API rejects this for a hospital admin (403) —
 * writing a clinical judgement is a clinician's call, not an admin task, the
 * same split drawn for acknowledging an alert.
 */
export async function addClinicalNote(
  patientId: string,
  pregnancyId: string,
  body: string
): Promise<ClinicalNote> {
  const res = await authFetch(
    `/api/patients/${patientId}/pregnancies/${pregnancyId}/notes/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    }
  );
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(firstError(data) ?? "Could not save this note.");
  }
  return data as ClinicalNote;
}

export interface StaffOption {
  id: string;
  full_name: string;
  email: string;
  role_code: string;
  role_name: string;
  is_active: boolean;
  is_user_active: boolean;
}

/**
 * Clinicians who can lead a pregnancy at this hospital.
 *
 * Doctors first, since they most often lead — but nurses and care managers are
 * included: in a small clinic a nurse-midwife is frequently the primary carer.
 * The API scopes this to the caller's own hospital and re-validates on write,
 * so this list is convenience, never the authorization boundary.
 */
export async function listClinicians(): Promise<StaffOption[]> {
  const staff = await authJson<StaffOption[]>("/api/staff/");
  const rank = (r: string) => (r === "provider" ? 0 : r === "nurse" ? 1 : 2);
  return staff
    .filter((s) => s.is_active && s.is_user_active)
    .sort(
      (a, b) =>
        rank(a.role_code) - rank(b.role_code) ||
        a.full_name.localeCompare(b.full_name)
    );
}

/**
 * Enrol a patient.
 *
 * Field-level validation errors come back keyed by field name, so the first
 * one is surfaced rather than a generic failure — a nurse needs to know which
 * box to fix, not that "something went wrong".
 */
export async function enrolPatient(
  input: EnrolmentInput
): Promise<PatientDetail> {
  const res = await authFetch("/api/patients/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(firstError(body) ?? "Could not enrol this patient.");
  }
  return body as PatientDetail;
}

function firstError(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;

  for (const value of Object.values(record)) {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    // Nested serializers (pregnancy, consent) report errors one level down.
    if (value && typeof value === "object") {
      const nested = firstError(value);
      if (nested) return nested;
    }
  }
  return null;
}
