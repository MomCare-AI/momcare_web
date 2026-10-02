"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "momcare_ngo_sidebar_collapsed";
const EVENT = "momcare-ngo-sidebar";

// Fallback for when storage is blocked, so the toggle still works per session.
let memory = false;

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return memory;
  }
}

/** Remembered NGO sidebar state (per browser), shared across tabs. */
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const setCollapsed = useCallback((next: boolean) => {
    memory = next;
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      /* storage unavailable — in-memory fallback above */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [collapsed, setCollapsed] as const;
}
