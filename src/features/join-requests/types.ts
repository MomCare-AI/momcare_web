/** The profile she sent, frozen when she sent the request. Its keys are
 *  exactly the fields of the enrolment form, so the form can be pre-filled
 *  with it as it is. Identity only: no medical history or pregnancy dating,
 *  those are the clinician's to enter at the visit. */
export interface JoinRequestProfile {
  first_name: string;
  last_name?: string;
  date_of_birth?: string | null;
  phone?: string;
  national_id?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  emergency_contact_email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export type JoinRequestStatus =
  "pending" | "approved" | "rejected" | "withdrawn";

/** Mirrors `PatientJoinRequestSerializer` plus the two fields
 *  `JoinRequestReviewView` adds from her account identity. */
export interface JoinRequest {
  id: string;
  organization: string;
  organization_name: string;
  organization_city: string;
  status: JoinRequestStatus;
  status_display: string;
  profile: JoinRequestProfile;
  /** The branch she asked for, or null. */
  location: string | null;
  location_name: string | null;
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
