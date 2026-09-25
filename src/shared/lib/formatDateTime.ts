/**
 * Every timestamp the backend sends is UTC (e.g. `2026-09-24T18:30:00Z`) —
 * per Ahmed's rule (backend, 24 Sep 2026): never render that raw string
 * directly, or a nurse in Chicago and one in Karachi see the same wrong
 * time. Always go through `new Date(iso)` first, which is what converts it
 * to the viewer's own local time — `undefined` as the locale argument below
 * means "use the browser's own locale/timezone," no per-user setting needed.
 *
 * `formatDate` is for genuinely date-only fields with no time-of-day —
 * EDD, LMP, date of birth, consent date. Those need no timezone
 * conversion at all; showing the calendar date as-is is correct.
 */

/** An instant in time — "24 Sep 2026, 6:30 PM" in the viewer's own timezone. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** A plain calendar date, no time-of-day — "24 Sep 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
