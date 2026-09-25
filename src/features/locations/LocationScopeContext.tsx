"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const STORAGE_KEY = "mc-selected-location";

interface LocationScopeValue {
  /** `null` means "All locations" — the default, hospital-wide view. */
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string | null) => void;
}

const LocationScopeContext = createContext<LocationScopeValue | null>(null);

/**
 * Which single site (if any) the portal is currently scoped to — a
 * per-viewer UI preference, not server data, so it's remembered in
 * localStorage rather than persisted anywhere shared. Only the Patients
 * tab actually reads this today (see `useLocationPatients`); every other
 * page stays hospital-wide until it has a real backend filter to scope by
 * — this context exists so that wiring can happen incrementally without
 * threading a new prop through every page.
 */
export function LocationScopeProvider({ children }: { children: ReactNode }) {
  // A lazy initializer, not an effect — this reads a one-time browser value
  // rather than subscribing to an external store, so there's nothing to
  // resync later.
  const [selectedLocationId, setSelectedLocationIdState] = useState<
    string | null
  >(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Private browsing / blocked storage — stay on "All locations".
      return null;
    }
  });

  const setSelectedLocationId = (id: string | null) => {
    setSelectedLocationIdState(id);
    try {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to persist to — the in-memory selection still works for
      // the rest of this session.
    }
  };

  return (
    <LocationScopeContext.Provider
      value={{ selectedLocationId, setSelectedLocationId }}
    >
      {children}
    </LocationScopeContext.Provider>
  );
}

export function useLocationScope(): LocationScopeValue {
  const ctx = useContext(LocationScopeContext);
  if (!ctx) {
    throw new Error(
      "useLocationScope must be used inside LocationScopeProvider"
    );
  }
  return ctx;
}
