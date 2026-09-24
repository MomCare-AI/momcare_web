/** Mirrors `core/locations/api/serializers.py::LocationSerializer`. */
export interface Location {
  id: string;
  name: string;
  /** IANA zone name, e.g. "Asia/Karachi". */
  timezone: string;
  phone: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  /** The staff member responsible for this site — a User id, not a Staff id. */
  location_manager: string | null;
  location_manager_name: string;
  /** This location's own override. Blank means "inherit the org's format" —
   *  always read `effective_date_format`, never this column directly. */
  date_format: string;
  effective_date_format: string;
  is_active: boolean;
  deactivated_at: string | null;
  deactivation_reason: string;
  /** `Location.active_patient_count` — a model property, not a stored field. */
  active_patient_count: number;
  created_at: string;
  updated_at: string;
}

export interface LocationCreateInput {
  name: string;
  location_manager: string;
  timezone?: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  date_format?: string;
}

/** Same fields, all optional — a partial edit leaving out `location_manager`
 *  keeps the existing manager (the server's own rule, not enforced here). */
export type LocationUpdateInput = Partial<LocationCreateInput>;

export interface LocationAssignmentStatus {
  has_active_patients: boolean;
  active_patient_count: number;
  message: string;
}
