"use client";

import { useSyncExternalStore } from "react";

import { getNoteTemplates, subscribeNoteTemplates } from "./store";

/** Same lazy-external-store pattern as the sidebar collapse hook — reads
 *  localStorage synchronously, no SSR/hydration mismatch. */
export function useNoteTemplates() {
  return useSyncExternalStore(
    subscribeNoteTemplates,
    getNoteTemplates,
    () => []
  );
}
