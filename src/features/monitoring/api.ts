import { authFetch, authJson } from "@/core/api/authFetch";

import type {
  AttentionPatient,
  Device,
  LatestReadings,
  ReadingType,
  RiskAssessment,
  RiskHistory,
  VitalReading,
} from "./types";

interface Paginated<T> {
  count: number;
  results: T[];
}

export function getLatestReadings(pregnancyId: string) {
  return authJson<LatestReadings>(
    `/api/pregnancies/${pregnancyId}/readings/latest/`
  );
}

export function listReadings(
  pregnancyId: string,
  params: { type?: ReadingType; since?: string; pageSize?: number } = {}
) {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.since) query.set("since", params.since);
  // Charts need the whole window, not the default page.
  query.set("page_size", String(params.pageSize ?? 200));
  return authJson<Paginated<VitalReading>>(
    `/api/pregnancies/${pregnancyId}/readings/?${query}`
  );
}

export interface ManualReadingInput {
  reading_type: ReadingType;
  value: string;
  value_secondary?: string;
  recorded_at?: string;
}

export async function recordReading(
  pregnancyId: string,
  input: ManualReadingInput
) {
  const res = await authFetch(`/api/pregnancies/${pregnancyId}/readings/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, source: "manual" }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      body?.value_secondary?.[0] ??
        body?.value?.[0] ??
        body?.detail ??
        "Could not record this reading."
    );
  }
  return body as VitalReading;
}

export function listDevices() {
  return authJson<Device[]>("/api/devices/");
}

export async function registerDevice(serialNumber: string) {
  const res = await authFetch("/api/devices/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serial_number: serialNumber }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      body?.serial_number?.[0] ??
        body?.detail ??
        "Could not register this device."
    );
  }
  return body as Device;
}

export async function assignDevice(
  pregnancyId: string,
  deviceId: string,
  acquisition: string
) {
  const res = await authFetch(`/api/pregnancies/${pregnancyId}/device/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: deviceId, acquisition }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.detail ?? "Could not assign this device.");
  return body as Device;
}

export async function unassignDevice(pregnancyId: string) {
  const res = await authFetch(`/api/pregnancies/${pregnancyId}/device/`, {
    method: "DELETE",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.detail ?? "Could not return this device.");
  return body as Device;
}

/** Development only — the API refuses this when DEBUG is off. */
export async function simulateReadings(
  pregnancyId: string,
  options: { hours: number; elevated: boolean }
) {
  const res = await authFetch(
    `/api/pregnancies/${pregnancyId}/readings/simulate/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    }
  );
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.detail ?? "Could not generate readings.");
  return body as { detail: string; created: number };
}

// ── Risk ────────────────────────────────────────────────────────────────────

export function getRiskHistory(pregnancyId: string) {
  return authJson<RiskHistory>(`/api/pregnancies/${pregnancyId}/risk/`);
}

/**
 * Re-run scoring on demand — after correcting a reading, or to show an
 * examiner the engine working.
 *
 * The API answers 200 with `detail` when the level did not change, and 201
 * with the new assessment when it did. Both are successes: "nothing changed"
 * is an answer, not a failure.
 */
export async function reassessRisk(pregnancyId: string) {
  const res = await authFetch(`/api/pregnancies/${pregnancyId}/risk/`, {
    method: "POST",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(body?.detail ?? "Could not re-score this pregnancy.");
  return {
    changed: res.status === 201,
    detail: body?.detail ?? null,
    current: (res.status === 201
      ? body
      : body?.current) as RiskAssessment | null,
  };
}

export async function acknowledgeRisk(
  pregnancyId: string,
  assessmentId: string
) {
  const res = await authFetch(
    `/api/pregnancies/${pregnancyId}/risk/${assessmentId}/acknowledge/`,
    { method: "POST" }
  );
  const body = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(body?.detail ?? "Could not acknowledge this assessment.");
  return body as RiskAssessment;
}

export function getAttentionQueue() {
  return authJson<{ count: number; results: AttentionPatient[] }>(
    "/api/attention/"
  );
}
