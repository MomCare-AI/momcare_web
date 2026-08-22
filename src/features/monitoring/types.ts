/** Mirrors core/monitoring/api/serializers.py. */

export type ReadingType = "blood_pressure" | "heart_rate" | "temperature";
export type ReadingSource = "device" | "manual" | "simulated";

export interface VitalReading {
  id: string;
  reading_type: ReadingType;
  reading_type_display: string;
  /** Systolic for blood pressure; the single value otherwise. */
  value: string;
  /** Diastolic — only present for blood pressure. */
  value_secondary: string | null;
  display_value: string;
  unit: string;
  recorded_at: string;
  source: ReadingSource;
  source_display: string;
  /** Generated data must stay visibly distinct from a real measurement. */
  is_simulated: boolean;
  device: string | null;
}

export interface LatestReadings {
  readings: Partial<Record<ReadingType, VitalReading>>;
  total_count: number;
}

export interface Device {
  id: string;
  serial_number: string;
  status: "in_stock" | "assigned" | "returned" | "faulty" | "lost";
  status_display: string;
  acquisition: string;
  acquisition_display: string;
  assigned_pregnancy: string | null;
  wearer_name: string;
  is_assigned: boolean;
  assigned_at: string | null;
  notes: string;
}

export const READING_TYPES: {
  type: ReadingType;
  label: string;
  short: string;
  unit: string;
}[] = [
  {
    type: "blood_pressure",
    label: "Blood pressure",
    short: "BP",
    unit: "mmHg",
  },
  { type: "heart_rate", label: "Heart rate", short: "HR", unit: "bpm" },
  { type: "temperature", label: "Temperature", short: "Temp", unit: "°C" },
];

export const ACQUISITION_OPTIONS = [
  { value: "loaned", label: "Loaned by the hospital" },
  { value: "sold", label: "Sold" },
  { value: "subsidised", label: "Subsidised" },
];

/**
 * How stale a reading is, in words.
 *
 * Silence is the failure mode that matters most in monitoring: a screen that
 * looks calm because data stopped arriving is worse than one showing a bad
 * number. So the age of the latest reading is always visible, never implied.
 */
export function readingAge(recordedAt: string): {
  text: string;
  stale: boolean;
} {
  const minutes = Math.floor(
    (Date.now() - new Date(recordedAt).getTime()) / 60000
  );

  if (minutes < 1) return { text: "just now", stale: false };
  if (minutes < 60) return { text: `${minutes} min ago`, stale: false };

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { text: `${hours}h ago`, stale: hours >= 12 };

  const days = Math.floor(hours / 24);
  return { text: `${days}d ago`, stale: true };
}

// ── Risk ────────────────────────────────────────────────────────────────────

export type RiskLevel = "stable" | "moderate" | "high" | "critical";

/** One reason behind a level, tied to the reading that caused it. */
export interface RiskFinding {
  code: string;
  level: RiskLevel;
  detail: string;
  reading_id: string | null;
}

export interface RiskAssessment {
  id: string;
  level: RiskLevel;
  level_display: string;
  /** Blank on the first assessment — there was nothing to transition from. */
  previous_level: RiskLevel | "";
  findings: RiskFinding[];
  reasons: string[];
  /** Which engine produced this. The portal reads both and labels them apart. */
  source: "rules" | "model";
  source_display: string;
  engine_version: string;
  /** Null for the rules engine, which has no score to report and does not
      invent one. Present when a trained model produced the row. */
  score: string | null;
  confidence: string | null;
  assessed_at: string;
  needs_acknowledgement: boolean;
  acknowledged_at: string | null;
  acknowledged_by_name: string;
}

export interface RiskHistory {
  current: RiskAssessment | null;
  history: RiskAssessment[];
}

/** One row of the queue a clinician works from — flat, because it is scanned. */
export interface AttentionPatient {
  patient_id: string;
  pregnancy_id: string;
  full_name: string;
  mrn: string | null;
  gestational_age: string;
  level: RiskLevel;
  level_display: string;
  reasons: string[];
  assessed_at: string;
  needs_acknowledgement: boolean;
  assigned_staff_name: string;
  has_responsible_clinician: boolean;
}

const RISK_RANK: Record<RiskLevel, number> = {
  stable: 0,
  moderate: 1,
  high: 2,
  critical: 3,
};

export function riskRank(level: RiskLevel | null): number {
  return level ? RISK_RANK[level] : -1;
}

/** Anything above stable is worth a clinician's time. */
export function isActionable(level: RiskLevel | null): boolean {
  return riskRank(level) > 0;
}

/**
 * Never assessed is not the same as stable.
 *
 * A patient nobody has measured must not be rendered with the same calm green
 * as one measured and found well — that would be the interface inventing
 * reassurance the data does not support.
 */
export function riskLabel(level: RiskLevel | null): string {
  if (!level) return "Not assessed";
  return {
    stable: "Stable",
    moderate: "Moderate",
    high: "High",
    critical: "Critical",
  }[level];
}

export function riskBadgeClass(level: RiskLevel | null): string {
  if (!level) return "mc-badge mc-badge-neutral";
  return `mc-badge mc-badge-${level}`;
}

/**
 * How a judgement is attributed on screen.
 *
 * The rules engine and a trained model write to the same table, so the only
 * honest thing the interface can do is say which one spoke.
 */
export function assessmentSource(assessment: RiskAssessment): string {
  if (assessment.source === "rules") return "Clinical rules";
  const confidence = assessment.confidence
    ? ` · ${Math.round(Number(assessment.confidence) * 100)}% confidence`
    : "";
  return `AI model ${assessment.engine_version}${confidence}`;
}
