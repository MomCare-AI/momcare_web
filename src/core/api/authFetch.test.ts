import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  authFetch,
  authJson,
  clearAccessToken,
  getAccessToken,
  SessionExpiredError,
  setAccessToken,
} from "./authFetch";

/**
 * The refresh-on-401 path is the riskiest code in the frontend: it decides
 * whether a clinician mid-consultation keeps working or gets thrown back to
 * the login screen. It is also invisible until it fails, so it is tested here
 * rather than left to be discovered in use.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("token storage", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips the access token", () => {
    setAccessToken("abc123");
    expect(getAccessToken()).toBe("abc123");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});

describe("authFetch", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => vi.restoreAllMocks());

  it("attaches the access token as a bearer header", async () => {
    setAccessToken("token-1");
    const fetchMock = vi.fn().mockResolvedValue(json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await authFetch("/api/patients/");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer token-1");
  });

  it("refuses to call the API when there is no token at all", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(authFetch("/api/patients/")).rejects.toBeInstanceOf(
      SessionExpiredError
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes once on a 401 and retries the original request", async () => {
    setAccessToken("expired");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ detail: "expired" }, 401))
      .mockResolvedValueOnce(json({ access: "fresh-token" }))
      .mockResolvedValueOnce(json({ results: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await authFetch("/api/patients/");

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain("/api/auth/refresh/");
    // The retry must carry the new token, not the stale one.
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(
      "Bearer fresh-token"
    );
    expect(getAccessToken()).toBe("fresh-token");
  });

  it("sends the refresh cookie, which is HttpOnly and never seen by JS", async () => {
    setAccessToken("expired");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({ access: "fresh" }))
      .mockResolvedValueOnce(json({}));
    vi.stubGlobal("fetch", fetchMock);

    await authFetch("/api/patients/");

    expect(fetchMock.mock.calls[1][1].credentials).toBe("include");
  });

  it("gives up and clears the token when the refresh itself fails", async () => {
    setAccessToken("expired");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({ detail: "no cookie" }, 400));
    vi.stubGlobal("fetch", fetchMock);

    await expect(authFetch("/api/patients/")).rejects.toBeInstanceOf(
      SessionExpiredError
    );
    expect(getAccessToken()).toBeNull();
  });

  it("triggers only one refresh when several requests expire together", async () => {
    // The portal shell loads the organization and the user in parallel; both
    // 401 at the same moment. Two refresh calls would race, and the second
    // would rotate away the token the first just stored.
    setAccessToken("expired");
    let refreshCalls = 0;
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("/api/auth/refresh/")) {
        refreshCalls += 1;
        return json({ access: "fresh" });
      }
      return refreshCalls === 0 ? json({}, 401) : json({ ok: true });
    });
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all([
      authFetch("/api/organization/me/"),
      authFetch("/api/auth/me/"),
    ]);

    expect(refreshCalls).toBe(1);
  });

  it("does not refresh on a non-401 failure", async () => {
    setAccessToken("valid");
    const fetchMock = vi.fn().mockResolvedValue(json({ detail: "boom" }, 500));
    vi.stubGlobal("fetch", fetchMock);

    const res = await authFetch("/api/patients/");

    expect(res.status).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("authJson", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns the parsed body on success", async () => {
    setAccessToken("valid");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ count: 3 })));

    await expect(
      authJson<{ count: number }>("/api/patients/")
    ).resolves.toEqual({ count: 3 });
  });

  it("raises the API's own message so the user sees what went wrong", async () => {
    setAccessToken("valid");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          json({ detail: "This patient already has an active pregnancy." }, 400)
        )
    );

    await expect(authJson("/api/patients/")).rejects.toThrow(
      "This patient already has an active pregnancy."
    );
  });

  it("falls back to a readable message when the body has no detail", async () => {
    setAccessToken("valid");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 503 }))
    );

    await expect(authJson("/api/patients/")).rejects.toThrow(/503/);
  });
});
