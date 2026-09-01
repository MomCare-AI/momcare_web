import { authFetch, authJson } from "@/core/api/authFetch";

import type { AlertDetail, AlertPage } from "./types";

/** Defaults to live alerts; pass "resolved" for the record of what happened.
 *  `assignedToMe` mirrors the patient list's own param — see
 *  core/alerts/api/views.py:_scope_to_assigned — and is silently ignored
 *  (empty result) for hospital_admin, for whom "my alerts" isn't a concept. */
export function listAlerts(
  status: "live" | "resolved" = "live",
  assignedToMe = false
) {
  const query = new URLSearchParams({ status });
  if (assignedToMe) query.set("assigned_to", "me");
  return authJson<AlertPage>(`/api/alerts/?${query}`);
}

export function getAlert(alertId: string) {
  return authJson<AlertDetail>(`/api/alerts/${alertId}/`);
}

export async function acknowledgeAlert(alertId: string) {
  const res = await authFetch(`/api/alerts/${alertId}/acknowledge/`, {
    method: "POST",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(body?.detail ?? "Could not acknowledge this alert.");
  return body as AlertDetail;
}

export async function resolveAlert(alertId: string, resolution: string) {
  const res = await authFetch(`/api/alerts/${alertId}/resolve/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolution }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.detail ?? "Could not close this alert.");
  return body as AlertDetail;
}
