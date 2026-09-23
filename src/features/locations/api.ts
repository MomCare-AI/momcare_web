import { authJson } from "@/core/api/authFetch";
import type { Location } from "./types";

/**
 * `GET /api/locations/` doesn't exist yet — `core/locations/api/views.py` is
 * an unimplemented placeholder — so this call will 404 until the backend
 * ships it. That's the correct, honest failure today, not a bug to work
 * around: see `LocationsTab`'s error state.
 */
export function listLocations() {
  return authJson<Location[]>("/api/locations/");
}
