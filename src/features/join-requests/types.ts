import type { RiskFactors } from "@/features/patients/types";

/** Mirrors `core/patients/api/serializers.py::PatientDraftSerializer` — what
 *  she reported before any hospital had her. Deliberately excludes location,
 *  care team and MRN: those are the hospital's decision, made only if and
 *  when it approves. */
export interface JoinRequestDraft extends Partial<RiskFactors> {
  first_name: string;
  last_name?: string;
  date_of_birth?: string | null;
  phone?: string;
  cnic?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  emergency_contact_email?: string;
  consent_date?: string | null;
  lmp?: string | null;
  edd?: string | null;
  gravida?: number | null;
  para?: number | null;
}

export type JoinRequestStatus =
  "pending" | "approved" | "rejected" | "withdrawn";

/** Mirrors `PatientJoinRequestSerializer` plus the two fields
 *  `JoinRequestReviewView` adds from her account identity — which may not
 *  match what she typed as first_name/last_name in the draft itself. */
export interface JoinRequest {
  id: string;
  organization: string;
  organization_name: string;
  organization_city: string;
  status: JoinRequestStatus;
  status_display: string;
  draft: JoinRequestDraft;
  decision_note: string;
  decided_at: string | null;
  patient_id: string | null;
  created_at: string;
  applicant_email: string;
  applicant_name: string;
}

/** `GET /api/patient-requests/` genuinely doesn't paginate — {count, results}
 *  only, none of the page/page_size/next/previous fields every other list
 *  endpoint carries. Not `Paginated<T>`; a different shape on purpose. */
export interface JoinRequestListResponse {
  count: number;
  results: JoinRequest[];
}
