"use client";

import { useCallback, useSyncExternalStore } from "react";

// Fallback values for when storage is blocked, so a toggle still works for
// the session instead of silently doing nothing.
const memory = new Map<string, boolean>();

const eventFor = (key: string) => `persisted-flag:${key}`;

/**
 * A boolean remembered per browser (localStorage) and shared across tabs,
 * for UI preferences like a collapsed sidebar. The server snapshot is
 * `false`, so server and first client render always agree.
 */
export function usePersistedFlag(key: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      window.addEventListener(eventFor(key), onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener(eventFor(key), onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    [key]
  );

  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(key) === "1";
    } catch {
      return memory.get(key) ?? false;
    }
  }, [key]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const set = useCallback(
    (next: boolean) => {
      memory.set(key, next);
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {
        /* storage unavailable: the in-memory value above still applies */
      }
      window.dispatchEvent(new Event(eventFor(key)));
    },
    [key]
  );

  return [value, set] as const;
}
