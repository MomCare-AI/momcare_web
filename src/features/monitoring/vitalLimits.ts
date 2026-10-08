import { MODEL_AGE_RANGE } from "@/shared/lib/age";
import { VITAL_FIELDS, type NumericVital } from "./types";

/**
 * The widest values a human being can physically have and still be measured.
 *
 * These are not "normal" ranges and not clinical alarm levels — a blood
 * pressure of 200 is dangerous but possible, and must be recordable so the
 * model can score it. They only stop an impossible entry (a typo such as a
 * temperature of 986, or a negative heart rate) from becoming a permanent
 * record, since readings can never be edited afterwards.
 */
export const VITAL_LIMITS: Record<NumericVital, { min: number; max: number }> =
  {
    age: { min: MODEL_AGE_RANGE.min, max: MODEL_AGE_RANGE.max },
    systolic_bp: { min: 50, max: 300 },
    diastolic_bp: { min: 20, max: 200 },
    heart_rate: { min: 20, max: 250 },
    body_temp_f: { min: 80, max: 115 },
    hemoglobin: { min: 2, max: 25 },
    blood_glucose: { min: 20, max: 800 },
    stress_score: { min: 0, max: 10 },
    phys_activity_score: { min: 0, max: 10 },
  };

const label = (field: NumericVital) =>
  VITAL_FIELDS.find((f) => f.field === field)?.label ?? field;

/**
 * The first problem with a set of typed vitals, or `null` when they are fine.
 * `values` holds the raw text from the form.
 */
export function checkVitalValues(
  values: Partial<Record<NumericVital, string>>
): string | null {
  let entered = 0;

  for (const { field } of VITAL_FIELDS) {
    const raw = values[field]?.trim();
    if (!raw) continue;
    entered += 1;

    if (!/^\d+(\.\d+)?$/.test(raw)) {
      return `${label(field)} must be a number.`;
    }
    const n = Number(raw);
    const { min, max } = VITAL_LIMITS[field];
    if (n < min || n > max) {
      return `${label(field)} must be between ${min} and ${max}.`;
    }
  }

  if (entered === 0) return "Enter at least one vital.";

  const sys = values.systolic_bp?.trim();
  const dia = values.diastolic_bp?.trim();
  if ((sys && !dia) || (!sys && dia)) {
    return "Blood pressure needs both the systolic and the diastolic value.";
  }
  if (sys && dia && Number(dia) >= Number(sys)) {
    return "The diastolic pressure must be lower than the systolic.";
  }

  return null;
}
