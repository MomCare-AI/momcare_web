/** Mirrors core/monitoring/api/serializers.py. */

export type ReadingSource = "device" | "manual";

/**
 * One reading event — up to nine vitals captured at a single moment.
 *
 * Every vital is optional: a reading does not have to carry all nine, and
 * hemoglobin usually will not, since it comes from a monthly lab report
 * rather than the band. Decimals arrive as strings (DRF's default); only
 * `age` is an integer.
 */
export interface VitalReading {
  id: string;
  age: number | null;
  systolic_bp: string | null;
  diastolic_bp: string | null;
  heart_rate: string | null;
  body_temp_f: string | null;
  hemoglobin: string | null;
  blood_glucose: string | null;
  stress_score: string | null;
  phys_activity_score: string | null;
  source: ReadingSource;
  source_display: string;
  recorded_at: string;
  device: string | null;
}

/**
 * The single most recent reading event, whatever it happened to measure.
 *
 * Answers "when did we last hear from this patient at all" — a different
 * question from "when was her haemoglobin last taken", which is what
 * latestForMetric answers off the full series. Both matter: a band that
 * stopped transmitting is invisible in the per-metric view, because each
 * vital still shows its own last good value.
 */
export interface LatestReadings {
  reading: VitalReading | null;
  total_count: number;
}

/** The reading columns that carry a number a chart can plot. */
export type NumericVital = Exclude<
  keyof VitalReading,
  "id" | "source" | "source_display" | "recorded_at" | "device"
>;

/**
 * A vital as a clinician reads it.
 *
 * Blood pressure is one metric drawn from two columns — a systolic without
 * its diastolic is not a blood pressure, which is why the API refuses to
 * accept one without the other.
 */
export type VitalMetric =
  | "blood_pressure"
  | "heart_rate"
  | "body_temp_f"
  | "blood_glucose"
  | "hemoglobin";

export const VITAL_METRICS: {
  metric: VitalMetric;
  label: string;
  short: string;
  unit: string;
  field: NumericVital;
  secondaryField?: NumericVital;
}[] = [
  {
    metric: "blood_pressure",
    label: "Blood pressure",
    short: "BP",
    unit: "mmHg",
    field: "systolic_bp",
    secondaryField: "diastolic_bp",
  },
  {
    metric: "heart_rate",
    label: "Heart rate",
    short: "HR",
    unit: "bpm",
    field: "heart_rate",
  },
  {
    metric: "body_temp_f",
    label: "Temperature",
    short: "Temp",
    unit: "\u00B0F",
    field: "body_temp_f",
  },
  {
    metric: "blood_glucose",
    label: "Blood glucose",
    short: "Glucose",
    unit: "mg/dL",
    field: "blood_glucose",
  },
  {
    metric: "hemoglobin",
    label: "Hemoglobin",
    short: "Hb",
    unit: "g/dL",
    field: "hemoglobin",
  },
];

/** Every vital the API accepts, in the order the entry form shows them. */
export const VITAL_FIELDS: {
  field: NumericVital;
  label: string;
  unit: string;
  step: string;
  placeholder: string;
}[] = [
  { field: "age", label: "Age", unit: "years", step: "1", placeholder: "28" },
  {
    field: "systolic_bp",
    label: "Systolic BP",
    unit: "mmHg",
    step: "0.1",
    placeholder: "120",
  },
  {
    field: "diastolic_bp",
    label: "Diastolic BP",
    unit: "mmHg",
    step: "0.1",
    placeholder: "80",
  },
  {
    field: "heart_rate",
    label: "Heart rate",
    unit: "bpm",
    step: "0.1",
    placeholder: "80",
  },
  {
    field: "body_temp_f",
    label: "Temperature",
    unit: "\u00B0F",
    step: "0.1",
    placeholder: "98.6",
  },
  {
    field: "hemoglobin",
    label: "Hemoglobin",
    unit: "g/dL",
    step: "0.1",
    placeholder: "12.0",
  },
  {
    field: "blood_glucose",
    label: "Blood glucose",
    unit: "mg/dL",
    step: "0.1",
    placeholder: "100",
  },
  {
    field: "stress_score",
    label: "Stress score",
    unit: "0-10",
    step: "0.1",
    placeholder: "5",
  },
  {
    field: "phys_activity_score",
    label: "Physical activity",
    unit: "0-10",
    step: "0.1",
    placeholder: "5",
  },
];

/** A vital as a number, or null when it was not measured. */
export function vitalValue(
  reading: VitalReading,
  field: NumericVital
): number | null {
  const raw = reading[field];
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * The most recent reading that actually measured this metric.
 *
 * Scanning the series rather than taking the newest row matters: one event
 * carries only the vitals taken at that moment, so the newest row is usually
 * silent about hemoglobin. Reporting that as "no reading" would hide a lab
 * result from a month ago that is still the most recent one there is.
 */
export function latestForMetric(
  readings: VitalReading[],
  metric: VitalMetric
): { reading: VitalReading; value: number; secondary: number | null } | null {
  const spec = VITAL_METRICS.find((m) => m.metric === metric);
  if (!spec) return null;

  for (const reading of readings) {
    const value = vitalValue(reading, spec.field);
    if (value === null) continue;
    const secondary = spec.secondaryField
      ? vitalValue(reading, spec.secondaryField)
      : null;
    return { reading, value, secondary };
  }
  return null;
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

export type RiskLevel = "low" | "medium" | "high";
export type ReviewStatus = "unreviewed" | "confirmed" | "corrected";

/**
 * One judgement, and the reading behind it.
 *
 * `risk_level` is what the model said; `final_risk_level` is what the system
 * acts on after postprocessing (an Africa-region Medium is escalated to High).
 * Always render `final_risk_level` — showing the raw level would tell a
 * clinician something different from what the alerting layer did.
 */
export interface RiskAssessment {
  id: string;
  risk_level: RiskLevel;
  risk_level_display: string;
  final_risk_level: RiskLevel;
  final_risk_level_display: string;
  /** Blank on the first assessment — there was nothing to transition from. */
  previous_risk_level: RiskLevel | "";
  /** Set once a clinician has confirmed or corrected the model. */
  confirmed_risk_level: RiskLevel | "";
  review_status: ReviewStatus;
  review_status_display: string;
  /** The model was less sure than this hospital's threshold requires. */
  flagged_for_review: boolean;
  reading: VitalReading | null;
  bp_category: string;
  heart_rate_category: string;
  temperature_category: string;
  glucose_category: string;
  hemoglobin_category: string;
  /** A 0-1 probability as a string, or null when the model reported none. */
  confidence: string | null;
  assessed_at: string;
  needs_review: boolean;
  verified_at: string | null;
  verified_by_name: string;
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
  risk_level: RiskLevel;
  risk_level_display: string;
  assessed_at: string;
  needs_review: boolean;
  assigned_staff_name: string;
  has_responsible_clinician: boolean;
}

const RISK_RANK: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export function riskRank(level: RiskLevel | null): number {
  return level ? RISK_RANK[level] : -1;
}

/** Anything above low is worth a clinician's time. */
export function isActionable(level: RiskLevel | null): boolean {
  return riskRank(level) > 0;
}

/**
 * Never assessed is not the same as low.
 *
 * A patient nobody has measured must not be rendered with the same calm green
 * as one measured and found well — that would be the interface inventing
 * reassurance the data does not support.
 */
/**
 * The retired four-level names, folded onto the model's three.
 *
 * Alert rows raised before the model landed still carry these. The collapse
 * is the backend's own, not invented here: `core/alerts/escalation.py` states
 * that an emergency finding "is still reported as High", and there is no
 * separate critical tier any more. Remove this once those rows are migrated.
 */
const LEGACY_LEVELS: Record<string, RiskLevel> = {
  stable: "low",
  moderate: "medium",
  critical: "high",
};

export function canonicalLevel(level: string | null): RiskLevel | null {
  if (!level) return null;
  if (level === "low" || level === "medium" || level === "high") return level;
  return LEGACY_LEVELS[level] ?? null;
}

export function riskLabel(level: RiskLevel | null): string {
  const canonical = canonicalLevel(level);
  if (!canonical) return "Not assessed";
  return { low: "Low", medium: "Medium", high: "High" }[canonical];
}

export function riskBadgeClass(level: RiskLevel | null): string {
  const canonical = canonicalLevel(level);
  if (!canonical) return "mc-badge mc-badge-neutral";
  return `mc-badge mc-badge-${canonical}`;
}

/**
 * How a judgement is attributed on screen.
 *
 * Every assessment now comes from the trained model — the rules engine was
 * removed, so there is no second producer to distinguish. The honest label is
 * the model plus how sure it was, and confidence is omitted rather than
 * invented when the model reported none.
 */
export function assessmentSource(assessment: RiskAssessment): string {
  if (!assessment.confidence) return "AI model";
  const percent = Math.round(Number(assessment.confidence) * 100);
  return `AI model \u00B7 ${percent}% confidence`;
}

/**
 * The per-vital categories behind a judgement, for the ones the model filled in.
 *
 * Blank means the vital was not measured, which is not the same as normal —
 * so an empty category is dropped rather than rendered as reassurance.
 */
export function assessmentCategories(
  assessment: RiskAssessment
): { label: string; value: string }[] {
  return [
    { label: "Blood pressure", value: assessment.bp_category },
    { label: "Heart rate", value: assessment.heart_rate_category },
    { label: "Temperature", value: assessment.temperature_category },
    { label: "Glucose", value: assessment.glucose_category },
    { label: "Hemoglobin", value: assessment.hemoglobin_category },
  ].filter((row) => row.value !== "");
}
