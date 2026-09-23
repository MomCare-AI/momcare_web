/**
 * Mirrors `core/locations/models.py::Location` — the backend model is fully
 * built, but its API view is an unimplemented placeholder, so this shape is
 * derived directly from the model fields rather than from a real serializer.
 * Reconcile against the real response once `core/locations/api/` ships.
 */
export interface Location {
  id: string;
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  /** The staff member responsible for this site, if one has been set. */
  location_manager: string | null;
  location_manager_name: string;
  /** `Location.active_patient_count` — a model property, not a stored field. */
  active_patient_count: number;
  is_active: boolean;
  created_at: string;
}
