import { DEMO_NGO_CREDENTIALS, DEMO_NGO_SESSION } from "../data/dummy";
import type { NgoSession } from "../types";

/**
 * Demo NGO authentication — validated locally, deliberately separate from the
 * hospital auth flow (`@/core/api/authFetch`). To go real, replace
 * `signInNgo` with a call to an NGO login API; callers don't change.
 */
const SESSION_KEY = "momcare_ngo_session";
const SESSION_EVENT = "momcare-ngo-session";

export class NgoAuthError extends Error {}

export async function signInNgo(
  email: string,
  password: string
): Promise<NgoSession> {
  // Short delay so the normal loading state is visible, as a real call would.
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (
    email.trim().toLowerCase() !== DEMO_NGO_CREDENTIALS.email ||
    password !== DEMO_NGO_CREDENTIALS.password
  ) {
    throw new NgoAuthError("Invalid business email or password.");
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(DEMO_NGO_SESSION));
  window.dispatchEvent(new Event(SESSION_EVENT));
  return DEMO_NGO_SESSION;
}

export function signOutNgo(): void {
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function subscribeNgoSession(onChange: () => void): () => void {
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Raw stored string (stable between calls, as useSyncExternalStore needs). */
export function readNgoSessionRaw(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}
