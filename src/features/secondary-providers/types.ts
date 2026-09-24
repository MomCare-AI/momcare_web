/** Mirrors `core/staff/api/serializers.py::SecondaryProviderSerializer`. */
export interface SecondaryProvider {
  id: string;
  name: string;
  email: string;
  phone: string;
  affiliation: string;
  /** How many patients reference this clinician — the reason it's a shared
   *  record rather than columns on each patient. */
  patient_count: number;
  created_at: string;
  updated_at: string;
}

export interface SecondaryProviderInput {
  name: string;
  email?: string;
  phone?: string;
  affiliation?: string;
}
