/**
 * The cache must not outlive the person it was filled for.
 *
 * This guards a real bug: signing out and signing back in as somebody else
 * showed the *previous* user's name, hospital and patients until a refresh
 * landed. The browser query client is a module-level singleton, so nothing
 * about changing user cleared it on its own.
 */

import { beforeEach, describe, expect, it } from "vitest";

import { clearQueryCache, getQueryClient } from "./queryClient";

describe("clearQueryCache", () => {
  beforeEach(() => {
    clearQueryCache();
  });

  it("drops data cached for the previous user", () => {
    const client = getQueryClient();
    client.setQueryData(["portal", "user"], {
      first_name: "Hina",
      role: "nurse",
    });
    client.setQueryData(["patients", "list"], [{ full_name: "Fatima Noor" }]);

    clearQueryCache();

    expect(client.getQueryData(["portal", "user"])).toBeUndefined();
    expect(client.getQueryData(["patients", "list"])).toBeUndefined();
  });

  it("clears every key, not only the ones a caller remembered to name", () => {
    // The failure mode being guarded against is a new feature adding a cache
    // key and nobody remembering to add it to a sign-out list.
    const client = getQueryClient();
    const keys = [
      ["portal", "organization"],
      ["monitoring", "attention"],
      ["alerts", "list", "live"],
      ["some-feature-nobody-has-written-yet"],
    ];
    keys.forEach((key, index) => client.setQueryData(key, { index }));

    clearQueryCache();

    keys.forEach((key) => expect(client.getQueryData(key)).toBeUndefined());
  });

  it("leaves the client usable afterwards", () => {
    // Clearing must not replace the singleton: components already mounted hold
    // a reference to it, and swapping it would leave them writing into a client
    // nothing reads from.
    const before = getQueryClient();

    clearQueryCache();
    const after = getQueryClient();
    after.setQueryData(["portal", "user"], { first_name: "Amina" });

    expect(after).toBe(before);
    expect(after.getQueryData(["portal", "user"])).toEqual({
      first_name: "Amina",
    });
  });
});
