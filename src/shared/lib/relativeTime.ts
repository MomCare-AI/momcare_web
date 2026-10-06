/**
 * How long ago something happened, in the shortest honest words:
 * "just now", "15 min ago", "6 hr ago", "3 d ago". Anything over thirty days
 * falls back to the date, since "112 d ago" says less than the date does.
 *
 * Takes `now` so tests (and a ticking clock) can pass their own.
 */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const minutes = Math.floor((now - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days <= 30) return `${days} d ago`;

  return new Date(then).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
