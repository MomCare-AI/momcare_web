/**
 * Where the API lives, resolved once.
 *
 * Four modules used to each write `process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"`.
 * That fallback is right on a laptop and dangerous in production: if the
 * variable is missing from the deployment, the shipped app quietly calls
 * *the visitor's own machine*, and the only symptom is a connection error that
 * looks like the backend is down.
 *
 * Two valid production values, and the difference matters:
 *
 *   ""                        same origin. Correct when a proxy rewrite serves
 *                             /api/* from the frontend host, which keeps the
 *                             refresh cookie first-party.
 *   "https://api.example.com" a separate host. Correct once the API has its own
 *                             subdomain and the cookie carries a Domain.
 *
 * So an empty string is a real answer, not a missing one. Only `undefined` is
 * a misconfiguration, and in production that is fatal on purpose — failing at
 * startup is far cheaper to diagnose than every request failing later.
 */

const configured = process.env.NEXT_PUBLIC_API_URL;

function resolve(): string {
  if (configured !== undefined) {
    // Trailing slashes would double up: paths already begin with "/api/".
    return configured.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Set it to an absolute API origin " +
        '(https://api.example.com), or to "" when a proxy rewrite serves /api/* ' +
        "from this host. It is read at build time, so set it before building."
    );
  }

  return "http://localhost:8000";
}

export const API_BASE = resolve();

/** Absolute URL for an API path. Pass paths that already start with "/api/". */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
