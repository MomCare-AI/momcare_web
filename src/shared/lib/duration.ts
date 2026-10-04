/**
 * Units for a long-running duration. A month here is a flat 30 days: durations
 * (monitoring time) are not tied to a calendar, unlike gestational age, whose
 * "month" is 28 days (see gestation.ts).
 */
const UNITS: [label: string, seconds: number][] = [
  ["mo", 30 * 86_400],
  ["w", 7 * 86_400],
  ["d", 86_400],
  ["h", 3_600],
  ["m", 60],
  ["s", 1],
];

/**
 * "1mo 2w 3d 4h 5m 6s" — months, weeks, days, hours, minutes, seconds, with
 * any unit that is zero left out ("2h 5s", not "0mo 0w 0d 2h 0m 5s"). A
 * duration of nothing reads "0s". Whole seconds only.
 */
export function formatDuration(
  totalSeconds: number | null | undefined
): string {
  let remaining = Math.max(0, Math.round(Number(totalSeconds) || 0));
  if (remaining === 0) return "0s";

  const parts: string[] = [];
  for (const [label, size] of UNITS) {
    const count = Math.floor(remaining / size);
    if (count > 0) parts.push(`${count}${label}`);
    remaining -= count * size;
  }
  return parts.join(" ");
}
