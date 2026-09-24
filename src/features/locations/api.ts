import { authFetch, authJson } from "@/core/api/authFetch";
import type { Paginated } from "@/features/patients/types";
import type {
  Location,
  LocationAssignmentStatus,
  LocationCreateInput,
  LocationUpdateInput,
} from "./types";

export function listLocations() {
  return authJson<Paginated<Location>>("/api/locations/");
}

export async function createLocation(
  input: LocationCreateInput
): Promise<Location> {
  const res = await authFetch("/api/locations/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      body?.name?.[0] ??
        body?.location_manager?.[0] ??
        body?.detail ??
        "Could not add this location."
    );
  }
  return body as Location;
}

export async function updateLocation(
  locationId: string,
  input: LocationUpdateInput
): Promise<Location> {
  const res = await authFetch(`/api/locations/${locationId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      body?.name?.[0] ?? body?.detail ?? "Could not save this location."
    );
  }
  return body as Location;
}

export function getLocationAssignmentStatus(locationId: string) {
  return authJson<LocationAssignmentStatus>(
    `/api/locations/${locationId}/assignment-status/`
  );
}

export async function deactivateLocation(
  locationId: string,
  reason?: string
): Promise<Location> {
  const res = await authFetch(`/api/locations/${locationId}/deactivate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: reason ?? "" }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.detail ?? "Could not deactivate this location.");
  }
  return body as Location;
}

export async function reactivateLocation(
  locationId: string
): Promise<Location> {
  const res = await authFetch(`/api/locations/${locationId}/reactivate/`, {
    method: "POST",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.detail ?? "Could not reactivate this location.");
  }
  return body as Location;
}

/** "Move all" only — a location being cleared out this way is being closed
 *  entirely, so a partial per-patient move doesn't serve the real use case. */
export async function moveLocationPatients(
  sourceLocationId: string,
  targetLocationId: string
): Promise<string> {
  const res = await authFetch(
    `/api/locations/${sourceLocationId}/move-patients/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_location_id: targetLocationId,
        move_all: true,
      }),
    }
  );
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.detail ?? "Could not move these patients.");
  }
  return body.detail as string;
}
