/**
 * Gestational age as "7 months 2 weeks 4 days".
 *
 * The backend owns the calculation (`Pregnancy.gestational_age_long_display`,
 * derived from the due date on every read). Where it sends that string the
 * app shows it as it is. Not every endpoint sends it yet (alerts, the
 * worklist, notes and the pregnancy header only carry the short "28w 3d"),
 * so for those this formats the short form the same way. The rule is the
 * backend's: a "month" is 4 weeks (28 days), not a calendar month.
 */

const SHORT = /^\s*(\d+)\s*w(?:\s*(\d+)\s*d)?\s*$/i;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Breaks a count of days into months (28 days), weeks and days. */
export function longFromDays(totalDays: number): string {
  const days = Math.max(0, Math.floor(totalDays));
  const months = Math.floor(days / 28);
  const weeks = Math.floor((days % 28) / 7);
  const rest = days % 7;

  const parts: string[] = [];
  if (months) parts.push(plural(months, "month"));
  if (weeks) parts.push(plural(weeks, "week"));
  if (rest) parts.push(plural(rest, "day"));
  return parts.length ? parts.join(" ") : "0 days";
}

/**
 * @param short the "28w 3d" form every pregnancy-bearing response carries
 * @param long  the backend's own long form, when that response has one
 */
export function formatGestationalAge(
  short: string | null | undefined,
  long?: string | null
): string {
  // The backend's answer wins when it actually broke the age into months.
  if (long && /month/i.test(long)) return long;

  const match = short ? SHORT.exec(short) : null;
  if (match) return longFromDays(Number(match[1]) * 7 + Number(match[2] ?? 0));

  // Nothing parseable ("—", empty, already long): show it untouched.
  return long || short || "—";
}

/** The single largest unit only: days under a week, weeks under a month,
 *  whole months beyond — for dense lists where the full breakdown is noise. */
export function briefFromDays(totalDays: number): string {
  const days = Math.max(0, Math.floor(totalDays));
  if (days < 7) return plural(days, "day");
  if (days < 28) return plural(Math.floor(days / 7), "week");
  return plural(Math.floor(days / 28), "month");
}

export function formatGestationalAgeBrief(
  short: string | null | undefined
): string {
  const match = short ? SHORT.exec(short) : null;
  if (match) return briefFromDays(Number(match[1]) * 7 + Number(match[2] ?? 0));
  return short || "—";
}
