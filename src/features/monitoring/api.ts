import { authFetch, authJson } from "@/core/api/authFetch";

import type {
  AttentionPatient,
  Device,
  LatestReadings,
  NumericVital,
  RiskAssessment,
  RiskHistory,
  RiskLevel,
  VitalReading,
} from "./types";

interface Paginated<T> {
  count: number;
  results: T[];
}

/**
 * The first real message in a DRF error body.
 *
 * Validation errors arrive keyed by field (`{"systolic_bp": ["..."]}`) while
 * refusals arrive as `{"detail": "..."}`. Reading only `detail` turned every
 * rejected vital into the same useless "could not record this" — the reason
 * was already on the wire, just never looked at.
 */
export function apiErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.trim()) return body;
  if (!body || typeof body !== "object") return fallback;

  const record = body as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;

  for (const value of Object.values(record)) {
    if (typeof value === "string" && value.trim()) return value;
    if (Array.isArray(value)) {
      const first = value.find((v) => typeof v === "string" && v.trim());
      if (typeof first === "string") return first;
    }
  }
  return fallback;
}

async function readOrThrow<T>(res: Response, fallback: string): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(apiErrorMessage(body, fallback));
  return body as T;
}

/**
 * The most recent reading event, for the "last contact" line.
 *
 * Deliberately its own request rather than reading the head of the series:
 * this answers whether data is still arriving at all, which is the silence
 * the panel exists to catch. Returns `{reading: null}` when there is none —
 * never a fabricated normal-looking value.
 */
export function getLatestReadings(pregnancyId: string) {
  return authJson<LatestReadings>(
    `/api/pregnancies/${pregnancyId}/readings/latest/`
  );
}

/**
 * A pregnancy's readings, newest first.
 *
 * The portal asks for the whole window rather than a page: the chart, the
 * per-vital summary and the staleness warnings are all derived from one
 * series, so paging it would silently truncate the clinical picture.
 */
export function listReadings(
  pregnancyId: string,
  params: { since?: string; pageSize?: number } = {}
) {
  const query = new URLSearchParams();
  if (params.since) query.set("since", params.since);
  query.set("page_size", String(params.pageSize ?? 200));
  return authJson<Paginated<VitalReading>>(
    `/api/pregnancies/${pregnancyId}/readings/?${query}`
  );
}

/**
 * One reading event. Every vital is optional, but at least one must be
 * present and blood pressure needs both halves — the API enforces both.
 */
export type ManualReadingInput = Partial<Record<NumericVital, number>>;

export interface RecordedReading extends VitalReading {
  /** True when this reading moved the pregnancy to a different risk level. */
  risk_changed: boolean;
  risk_level: RiskLevel | null;
}

export async function recordReading(
  pregnancyId: string,
  input: ManualReadingInput
) {
  const res = await authFetch(`/api/pregnancies/${pregnancyId}/readings/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      source: "manual",
      recorded_at: new Date().toISOString(),
    }),
  });
  return readOrThrow<RecordedReading>(res, "Could not record this reading.");
}

export function listDevices() {
  return authJson<Device[]>("/api/devices/");
}

/**
 * Add one unit to this hospital's stock, unassigned.
 *
 * `acquisition` — sold / loaned / subsidised — is how the patient came by the
 * band, and the API accepts it here as well as at assignment. Blank is
 * allowed: stock is often bought before anyone decides how it will be handed
 * out, and guessing would put a billing claim in the record that nobody made.
 */
export async function registerDevice(serialNumber: string, acquisition = "") {
  const res = await authFetch("/api/devices/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serial_number: serialNumber, acquisition }),
  });
  return readOrThrow<Device>(res, "Could not register this device.");
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
  return readOrThrow<Device>(res, "Could not assign this device.");
}

export async function unassignDevice(pregnancyId: string) {
  const res = await authFetch(`/api/pregnancies/${pregnancyId}/device/`, {
    method: "DELETE",
  });
  return readOrThrow<Device>(res, "Could not return this device.");
}

// ── Risk ────────────────────────────────────────────────────────────────────

export function getRiskHistory(pregnancyId: string) {
  return authJson<RiskHistory>(`/api/pregnancies/${pregnancyId}/risk/`);
}

/**
 * Re-run scoring on demand — after correcting a reading, or to show an
 * examiner the model working.
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
    throw new Error(
      apiErrorMessage(body, "Could not re-score this pregnancy.")
    );

  const changed = res.status === 201;
  return {
    changed,
    detail: (body?.detail as string | null) ?? null,
    current: (changed ? body : body?.current) as RiskAssessment | null,
  };
}

/**
 * A clinician's review of one assessment: agree with the model, or correct it.
 *
 * There is no "seen but not judged" state — the server requires a level, and
 * derives confirmed-vs-corrected by comparing it to what the model said. A
 * bare acknowledgement would let the queue look attended to without anyone
 * having actually decided anything.
 */
export async function verifyRisk(
  pregnancyId: string,
  assessmentId: string,
  confirmedLevel: RiskLevel
) {
  const res = await authFetch(
    `/api/pregnancies/${pregnancyId}/risk/${assessmentId}/verify/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmed_risk_level: confirmedLevel }),
    }
  );
  return readOrThrow<RiskAssessment>(res, "Could not record this review.");
}

export function getAttentionQueue() {
  return authJson<{ count: number; results: AttentionPatient[] }>(
    "/api/attention/"
  );
}
