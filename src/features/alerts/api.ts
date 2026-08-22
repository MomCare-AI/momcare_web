import { authFetch, authJson } from "@/core/api/authFetch";

import type { AlertDetail, AlertPage } from "./types";

/** Defaults to live alerts; pass "resolved" for the record of what happened. */
export function listAlerts(status: "live" | "resolved" = "live") {
  return authJson<AlertPage>(`/api/alerts/?status=${status}`);
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
