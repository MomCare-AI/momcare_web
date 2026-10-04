/**
 * Whole years between a date of birth and today, or null when there is no
 * usable date. Derived on read, never stored, so it can never go stale or be
 * mistyped — the same rule gestational age follows.
 */
export function ageFromDob(
  dob: string | null | undefined,
  today: Date = new Date()
): number | null {
  if (!dob) return null;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return null;
  let years = today.getFullYear() - born.getFullYear();
  const hadBirthday =
    today.getMonth() > born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() >= born.getDate());
  if (!hadBirthday) years -= 1;
  return years >= 0 ? years : null;
}

/** The range the risk model accepts (backend VITAL_BOUNDS["age"]). */
export const MODEL_AGE_RANGE = { min: 10, max: 60 } as const;
