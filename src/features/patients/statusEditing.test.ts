import { describe, expect, it } from "vitest";

import {
  buildChoices,
  keyOf,
  planChanges,
  safeColor,
  uniqueByName,
  type CatalogueLabel,
} from "./statusEditing";
import type { PatientStatusEntry } from "./types";

const label = (
  name: string,
  color: string | null = "#2f8a72"
): CatalogueLabel => ({
  id: `l-${name}`,
  name,
  description: `${name} description`,
  color,
});

const entry = (
  name: string,
  addedBy: string,
  over: Partial<PatientStatusEntry> = {}
): PatientStatusEntry => ({
  id: `e-${name}-${addedBy}`,
  patient: "p1",
  patient_name: "P",
  pregnancy: null,
  name,
  description: "",
  color: "#d65f58",
  added_by: addedBy,
  added_by_name: addedBy,
  created_at: "",
  updated_at: "",
  ...over,
});

const me = { id: "u-me", isAdmin: false };

describe("buildChoices", () => {
  it("lists the catalogue, marking what the patient already has", () => {
    const choices = buildChoices(
      [label("Stable"), label("Follow up")],
      [entry("stable", "u-me")],
      me
    );
    expect(choices.map((c) => [c.name, c.assigned])).toEqual([
      ["Stable", true],
      ["Follow up", false],
    ]);
  });

  it("matches names ignoring case and spaces", () => {
    expect(keyOf("  Follow UP ")).toBe("follow up");
    const [c] = buildChoices(
      [label("Follow up")],
      [entry(" FOLLOW up", "u-me")],
      me
    );
    expect(c.assigned).toBe(true);
  });

  it("keeps a status whose catalogue entry was deleted, so it can still be removed", () => {
    const choices = buildChoices(
      [label("Stable")],
      [entry("Old status", "u-me")],
      me
    );
    const orphan = choices.find((c) => c.name === "Old status")!;
    expect(orphan).toMatchObject({
      assigned: true,
      inCatalogue: false,
      removable: true,
    });
  });

  it("locks a status someone else added, unless the user is a hospital admin", () => {
    const theirs = [entry("Stable", "u-other")];
    expect(buildChoices([label("Stable")], theirs, me)[0].removable).toBe(
      false
    );
    expect(
      buildChoices([label("Stable")], theirs, {
        id: "u-admin",
        isAdmin: true,
      })[0].removable
    ).toBe(true);
  });

  it("is only removable when every entry of that name is the user's own", () => {
    const mixed = [
      entry("Stable", "u-me"),
      entry("Stable", "u-other", { id: "e2" }),
    ];
    expect(buildChoices([label("Stable")], mixed, me)[0].removable).toBe(false);
  });

  it("falls back to the default colour for a missing or malformed one", () => {
    expect(safeColor(null)).toBe("#4361ee");
    expect(safeColor("red")).toBe("#4361ee");
    expect(safeColor("#2f8a72")).toBe("#2f8a72");
  });
});

describe("planChanges", () => {
  const choices = buildChoices(
    [label("Stable"), label("Follow up"), label("Locked")],
    [entry("Stable", "u-me"), entry("Locked", "u-other")],
    me
  );

  it("adds what was newly ticked and removes what was unticked", () => {
    const plan = planChanges(choices, new Set(["follow up", "locked"]));
    expect(plan.toAdd.map((c) => c.name)).toEqual(["Follow up"]);
    expect(plan.toRemove.map((e) => e.name)).toEqual(["Stable"]);
  });

  it("does nothing when nothing changed", () => {
    const plan = planChanges(choices, new Set(["stable", "locked"]));
    expect(plan).toEqual({ toAdd: [], toRemove: [] });
  });

  it("never removes a locked status, even if it ends up unticked", () => {
    const plan = planChanges(choices, new Set(["stable"]));
    expect(plan.toRemove.map((e) => e.name)).not.toContain("Locked");
  });

  it("removes every entry of a repeated status", () => {
    const repeated = buildChoices(
      [label("Stable")],
      [entry("Stable", "u-me"), entry("Stable", "u-me", { id: "e2" })],
      me
    );
    expect(planChanges(repeated, new Set()).toRemove).toHaveLength(2);
  });
});

describe("uniqueByName", () => {
  it("shows each status once", () => {
    const out = uniqueByName([
      { name: "Stable" },
      { name: "stable" },
      { name: "Other" },
    ]);
    expect(out.map((s) => s.name)).toEqual(["Stable", "Other"]);
  });
});
