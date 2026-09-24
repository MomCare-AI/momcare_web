import { authJson } from "@/core/api/authFetch";
import type { Paginated } from "@/features/patients/types";
import type { Location } from "./types";

/** Real as of Ahmed's Sep 2026 backend push — confirmed live against
 *  production. Paginated like every other list endpoint, not a plain array
 *  (an earlier, stub-era version of this file assumed the latter). */
export function listLocations() {
  return authJson<Paginated<Location>>("/api/locations/");
}
