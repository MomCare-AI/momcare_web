"use client";

import { useSyncExternalStore } from "react";

import { readNgoSessionRaw, subscribeNgoSession } from "../services/ngoAuth";
import type { NgoSession } from "../types";

/** `undefined` = not yet known (server / first paint), `null` = signed out. */
export function useNgoSession(): NgoSession | null | undefined {
  const raw = useSyncExternalStore(
    subscribeNgoSession,
    readNgoSessionRaw,
    () => undefined
  );
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as NgoSession;
  } catch {
    return null;
  }
}
