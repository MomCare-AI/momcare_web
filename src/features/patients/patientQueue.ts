/**
 * The ordered list of patients a clinician opened a record from, so the
 * patient page can offer "previous / next" through that same list.
 *
 * Kept in sessionStorage (one tab, gone when it closes) as just the ids in
 * display order — no patient data is stored.
 */
const KEY = "mc-patient-queue";
const CHANGED = "mc-patient-queue";

function safeStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveQueue(ids: string[]): void {
  const store = safeStorage();
  if (!store) return;
  try {
    store.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(CHANGED));
  } catch {
    /* storage full or blocked: the arrows simply won't appear */
  }
}

/** The raw stored value, which is what useSyncExternalStore compares. */
export function readQueueRaw(): string | null {
  try {
    return safeStorage()?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

export function parseQueue(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export function subscribeQueue(onChange: () => void): () => void {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Where a patient sits in the queue, and who is on either side of them. */
export function queuePosition(ids: string[], currentId: string) {
  const index = ids.indexOf(currentId);
  if (index === -1) return null;
  return {
    position: index + 1,
    total: ids.length,
    previousId: index > 0 ? ids[index - 1] : null,
    nextId: index < ids.length - 1 ? ids[index + 1] : null,
  };
}
