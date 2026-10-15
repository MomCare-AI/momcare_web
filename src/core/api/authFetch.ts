/**
 * Authenticated fetch with one silent refresh on expiry.
 *
 * Access tokens last an hour. Without this, a clinician mid-consultation is
 * thrown back to the login screen while a perfectly valid refresh cookie sits
 * in the browser — the endpoint existed, nothing called it.
 *
 * The refresh token is HttpOnly and scoped to /api/auth, so it never passes
 * through JavaScript; only the refresh call needs `credentials: "include"`.
 *
 * The access token itself lives only in memory. It is never written to
 * localStorage, so a script injected into the page cannot read it back later.
 * A page load or a new tab starts without one and asks the server for a fresh
 * token with the HttpOnly cookie, so the person stays signed in. Tabs take
 * turns refreshing (the refresh token rotates, so two refreshes at once would
 * revoke each other) and tell each other when one of them signs out.
 */

import { API_BASE } from "./apiBase";

// An older version kept the token here. It is deleted on sight so a token left
// behind by that version cannot be read by anything.
const LEGACY_TOKEN_KEY = "access_token";
// `next dev` runs on localhost against the live API, where the refresh cookie
// is not sent back, so development keeps the token for the length of the tab.
const DEV_TOKEN_KEY = "mc_dev_access_token";
const KEEP_FOR_TAB = process.env.NODE_ENV === "development";

let memoryToken: string | null = null;

const channel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("momcare-auth")
    : null;
channel?.addEventListener("message", (event) => {
  // Another tab signed out: this one must not keep acting as that person.
  if (event.data === "signed-out") memoryToken = null;
});

function dropLegacyToken() {
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // Storage can be blocked; there is then nothing to remove.
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  if (!memoryToken && KEEP_FOR_TAB) {
    try {
      memoryToken = sessionStorage.getItem(DEV_TOKEN_KEY);
    } catch {
      // ignore
    }
  }
  return memoryToken;
}

export function setAccessToken(token: string): void {
  memoryToken = token;
  dropLegacyToken();
  if (KEEP_FOR_TAB) {
    try {
      sessionStorage.setItem(DEV_TOKEN_KEY, token);
    } catch {
      // ignore
    }
  }
}

export function clearAccessToken(): void {
  memoryToken = null;
  dropLegacyToken();
  try {
    sessionStorage.removeItem(DEV_TOKEN_KEY);
  } catch {
    // ignore
  }
  channel?.postMessage("signed-out");
}

/** Distinguishes "the server couldn't be reached" from "the refresh token
 *  was rejected" -- a cold start or a network blip on the refresh call is
 *  not the same thing as a genuinely expired session, and must not force
 *  one. See the docstring on refreshAccessToken. */
const REFRESH_UNAVAILABLE = Symbol("refresh-unavailable");
type RefreshOutcome = string | null | typeof REFRESH_UNAVAILABLE;

/** In-flight refresh, shared so parallel 401s trigger one call, not several. */
let refreshInFlight: Promise<RefreshOutcome> | null = null;

/**
 * Only a 4xx from the refresh endpoint means the refresh token itself was
 * rejected (missing cookie, expired, revoked) -- that's a real session end.
 * A 5xx or a thrown network error means the *server* failed, which the
 * production backend does do (a cold start can take 10s+) -- treating that
 * the same as a rejection was logging clinicians out for a slow backend,
 * not an expired session.
 */
async function refreshAccessToken(): Promise<RefreshOutcome> {
  if (refreshInFlight) return refreshInFlight;

  const refresh = async (): Promise<RefreshOutcome> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh/`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status >= 500) return REFRESH_UNAVAILABLE;
      if (!res.ok) return null;
      const { access } = await res.json();
      if (!access) return null;
      setAccessToken(access);
      return access as string;
    } catch {
      return REFRESH_UNAVAILABLE;
    }
  };

  // Tabs take turns: the refresh token rotates, so two tabs refreshing at the
  // same moment would revoke each other and sign the person out.
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  const run = async (): Promise<RefreshOutcome> =>
    locks
      ? ((await locks.request("momcare-refresh", refresh)) as RefreshOutcome)
      : refresh();
  refreshInFlight = run().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export class SessionExpiredError extends Error {
  constructor() {
    super("Your session has expired. Please sign in again.");
    this.name = "SessionExpiredError";
  }
}

/**
 * Fetch an API path with the access token attached.
 *
 * On 401, refreshes once and retries. If the refresh also fails the token is
 * cleared and SessionExpiredError is thrown, so callers can redirect.
 */
export async function authFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const call = async (token: string | null) => {
    try {
      return await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (error) {
      // A request that never reached the server (offline, a dropped
      // connection) says "Failed to fetch" in the browser, which means nothing
      // to the person looking at the screen.
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      throw new Error(
        "Could not reach the server. Check your connection and try again."
      );
    }
  };

  let token = getAccessToken();
  if (!token) {
    // A new tab or a reloaded page: no token in memory yet, but the secure
    // cookie may still be good.
    const restored = await refreshAccessToken();
    if (restored === REFRESH_UNAVAILABLE) {
      throw new Error("Could not reach the server. Please try again.");
    }
    if (!restored) throw new SessionExpiredError();
    token = restored;
  }

  let response = await call(token);
  if (response.status !== 401) return response;

  const refreshed = await refreshAccessToken();
  if (refreshed === REFRESH_UNAVAILABLE) {
    // Not a rejection -- the access token may still be perfectly valid, and
    // clearing it here would force a real logout over what might just be a
    // slow backend. Surface it as an ordinary failure instead.
    throw new Error("Could not reach the server. Please try again.");
  }
  if (!refreshed) {
    clearAccessToken();
    throw new SessionExpiredError();
  }

  response = await call(refreshed);
  if (response.status === 401) {
    clearAccessToken();
    throw new SessionExpiredError();
  }
  return response;
}

/** authFetch plus JSON parsing, raising the API's own message on failure. */
export async function authJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await authFetch(path, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      body?.detail ?? `Request failed (${res.status}). Please try again.`
    );
  }
  return body as T;
}

/**
 * End the session on the server as well as in this tab.
 *
 * Dropping the access token locally only hides the session — the refresh
 * cookie stays valid until it expires, so anyone replaying it gets a fresh
 * access token. This blacklists it.
 *
 * Never throws: a failed sign-out must still sign the user out locally. The
 * worst case is a server-side session that expires on its own schedule, which
 * is strictly better than leaving someone logged in on a shared machine
 * because the network blipped.
 */
export async function logout(): Promise<void> {
  const token = getAccessToken();
  try {
    await fetch(`${API_BASE}/api/auth/logout/`, {
      method: "POST",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    // Deliberately swallowed — see the docstring.
  }
}
