import { describe, expect, it } from "vitest";

import { ngoRepository } from "./ngoRepository";

const byId = async (id: string) =>
  (await ngoRepository.listBands()).find((b) => b.id === id)!;

describe("ngoRepository band lifecycle", () => {
  it("adds sequential serials in a new batch", async () => {
    const before = (await ngoRepository.listBands()).length;
    const created = await ngoRepository.addBands("T-1", 3);
    expect(created).toHaveLength(3);
    expect(new Set(created.map((b) => b.serial)).size).toBe(3);
    expect(created.every((b) => b.status === "in_stock")).toBe(true);
    expect((await ngoRepository.listBands()).length).toBe(before + 3);
  });

  it("rejects an empty batch and an out-of-range quantity", async () => {
    await expect(ngoRepository.addBands("  ", 5)).rejects.toThrow(/batch/i);
    await expect(ngoRepository.addBands("X", 0)).rejects.toThrow(/quantity/i);
    await expect(ngoRepository.addBands("X", 201)).rejects.toThrow(/quantity/i);
  });

  it("takes a deployed band through recall, return, restock", async () => {
    await ngoRepository.requestRecall("b1", "Battery recall");
    expect((await byId("b1")).status).toBe("recall_pending");

    await ngoRepository.markReturned("b1");
    const returned = await byId("b1");
    expect(returned.status).toBe("returned");
    expect(returned.holderName).toBeNull();

    await ngoRepository.restock("b1");
    const restocked = await byId("b1");
    expect(restocked.status).toBe("in_stock");
    expect(restocked.events.map((e) => e.type)).toEqual([
      "added",
      "recall_requested",
      "returned",
      "restocked",
    ]);
  });

  it("only retires bands that are back with the NGO, with a reason", async () => {
    await expect(ngoRepository.retire("b2", "worn")).rejects.toThrow(
      /return the band/i
    );
    await ngoRepository.markReturned("b2");
    await expect(ngoRepository.retire("b2", "  ")).rejects.toThrow(/reason/i);
    await ngoRepository.retire("b2", "Cracked casing");
    expect((await byId("b2")).status).toBe("retired");
  });

  it("refuses to change a retired band or restock one that isn't returned", async () => {
    await expect(ngoRepository.markReturned("b2")).rejects.toThrow();
    await expect(ngoRepository.restock("b4")).rejects.toThrow(/returned/i);
  });
});

describe("ngoRepository access requests", () => {
  const valid = {
    organizationName: "Helping Hands",
    contactName: "Sara Ali",
    email: "sara@helpinghands.org",
    phone: "",
    country: "Pakistan",
    services: ["bands" as const],
    message: "",
  };

  it("accepts a complete request", async () => {
    await expect(
      ngoRepository.submitAccessRequest(valid)
    ).resolves.toBeUndefined();
  });

  it("rejects missing names, a bad email, or no service", async () => {
    await expect(
      ngoRepository.submitAccessRequest({ ...valid, organizationName: " " })
    ).rejects.toThrow(/organization/i);
    await expect(
      ngoRepository.submitAccessRequest({ ...valid, email: "not-an-email" })
    ).rejects.toThrow(/email/i);
    await expect(
      ngoRepository.submitAccessRequest({ ...valid, services: [] })
    ).rejects.toThrow(/service/i);
  });
});
