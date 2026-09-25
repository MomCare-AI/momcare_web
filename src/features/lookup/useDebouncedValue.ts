import { useEffect, useState } from "react";

/** ~350ms after the last keystroke, not on every keystroke — same pattern
 *  already used by `MonitoringNotesPanel`'s notes search. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
