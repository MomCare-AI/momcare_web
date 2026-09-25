/** Mirrors `core/monitoring/api/serializers.py::StatusLabelSerializer`.
 *  The System Governance catalogue — a hospital-invented status vocabulary
 *  ("Critical", "Telehealth Connected", "Waiting"...), managed the same way
 *  as `ClinicalTag`. Not surfaced on the Clinical Overview / patient side. */
export interface StatusLabel {
  id: string;
  name: string;
  description: string;
  color: string | null;
  organization: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

/** `GET /api/status-labels/` — same shape as `ClinicalTagListResponse`
 *  (`{count, results}`, not the standard pagination envelope). */
export interface StatusLabelListResponse {
  count: number;
  results: StatusLabel[];
}
