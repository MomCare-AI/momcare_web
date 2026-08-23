/**
 * The empty string is a valid answer here, and that is the whole point.
 *
 * Under a proxy rewrite the API is same-origin, so NEXT_PUBLIC_API_URL is
 * deliberately "". A guard that rejected "missing or empty" would crash the
 * deployment that was configured correctly. Only `undefined` is a mistake.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL = process.env.NEXT_PUBLIC_API_URL;

/** Re-import with a fresh module registry so the top-level resolve() runs again. */
async function loadWith(apiUrl: string | undefined, nodeEnv: string) {
  vi.resetModules();
  if (apiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = apiUrl;
  vi.stubEnv("NODE_ENV", nodeEnv);
  return import("./apiBase");
}

afterEach(() => {
  vi.unstubAllEnvs();
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = ORIGINAL;
});

describe("API base resolution", () => {
  it("treats an empty value as same-origin, not as missing", async () => {
    const { API_BASE, apiUrl } = await loadWith("", "production");

    expect(API_BASE).toBe("");
    expect(apiUrl("/api/auth/login/")).toBe("/api/auth/login/");
  });

  it("uses an absolute origin when one is given", async () => {
    const { apiUrl } = await loadWith("https://api.example.com", "production");

    expect(apiUrl("/api/auth/login/")).toBe(
      "https://api.example.com/api/auth/login/"
    );
  });

  it("strips a trailing slash so paths do not double up", async () => {
    const { apiUrl } = await loadWith("https://api.example.com/", "production");

    expect(apiUrl("/api/auth/login/")).toBe(
      "https://api.example.com/api/auth/login/"
    );
  });

  it("refuses to start in production when nothing is configured", async () => {
    // Silent fallback to localhost would mean the deployed app calls the
    // visitor's own machine, and the only symptom is a connection error that
    // looks like the backend is down.
    await expect(loadWith(undefined, "production")).rejects.toThrow(
      /NEXT_PUBLIC_API_URL is not set/
    );
  });

  it("still falls back to localhost in development", async () => {
    const { API_BASE } = await loadWith(undefined, "development");

    expect(API_BASE).toBe("http://localhost:8000");
  });
});
