/**
 * Authenticated fetch with one silent refresh on expiry.
 *
 * Access tokens last an hour. Without this, a clinician mid-consultation is
 * thrown back to the login screen while a perfectly valid refresh cookie sits
 * in the browser — the endpoint existed, nothing called it.
 *
 * The refresh token is HttpOnly and scoped to /api/auth, so it never passes
 * through JavaScript; only the refresh call needs `credentials: "include"`.
 */

import { API_BASE } from "./apiBase";

const TOKEN_KEY = "access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** In-flight refresh, shared so parallel 401s trigger one call, not several. */
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh/`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return null;
      const { access } = await res.json();
      if (!access) return null;
      setAccessToken(access);
      return access as string;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

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
  const call = (token: string | null) =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  const token = getAccessToken();
  if (!token) throw new SessionExpiredError();

  let response = await call(token);
  if (response.status !== 401) return response;

  const refreshed = await refreshAccessToken();
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
