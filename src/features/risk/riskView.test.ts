import { describe, expect, it } from "vitest";

import { makePatient } from "@/features/patients/testFixtures";
import {
  bucketOf,
  countByBucket,
  filterPatients,
  sortByRisk,
} from "./riskView";

const high = makePatient({ id: "h", full_name: "Hina", risk_level: "high" });
const med = makePatient({ id: "m", full_name: "Mariam", risk_level: "medium" });
const low = makePatient({ id: "l", full_name: "Lubna", risk_level: "low" });
const none = makePatient({ id: "n", full_name: "Nida", risk_level: null });

describe("risk buckets", () => {
  it("keeps 'not assessed' apart from low risk", () => {
    expect(bucketOf(none)).toBe("none");
    expect(bucketOf(low)).toBe("low");
    expect(countByBucket([high, med, low, none, none])).toEqual({
      high: 1,
      medium: 1,
      low: 1,
      none: 2,
    });
  });
});

describe("sortByRisk", () => {
  it("puts the highest risk first and not-assessed last", () => {
    const order = sortByRisk([none, low, high, med]).map((p) => p.id);
    expect(order).toEqual(["h", "m", "l", "n"]);
  });

  it("within a level, shows the one with most reviews waiting first", () => {
    const a = makePatient({
      id: "a",
      full_name: "Aaa",
      risk_level: "high",
      pending_risk_count: 1,
    });
    const b = makePatient({
      id: "b",
      full_name: "Bbb",
      risk_level: "high",
      pending_risk_count: 4,
    });
    expect(sortByRisk([a, b]).map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("then the most recently assessed, then by name", () => {
    const older = makePatient({
      id: "o",
      full_name: "Zed",
      risk_level: "low",
      risk_assessed_at: "2026-09-01T00:00:00Z",
    });
    const newer = makePatient({
      id: "n2",
      full_name: "Amy",
      risk_level: "low",
      risk_assessed_at: "2026-10-01T00:00:00Z",
    });
    expect(sortByRisk([older, newer]).map((p) => p.id)).toEqual(["n2", "o"]);

    const x = makePatient({ id: "x", full_name: "Bea", risk_level: "low" });
    const y = makePatient({ id: "y", full_name: "Ann", risk_level: "low" });
    expect(sortByRisk([x, y]).map((p) => p.id)).toEqual(["y", "x"]);
  });

  it("does not change the list it was given", () => {
    const input = [none, high];
    sortByRisk(input);
    expect(input.map((p) => p.id)).toEqual(["n", "h"]);
  });
});

describe("filterPatients", () => {
  const all = [high, med, low, none];

  it("filters by bucket and by name or MRN, case-insensitively", () => {
    expect(filterPatients(all, { bucket: "high", search: "" })).toEqual([high]);
    expect(filterPatients(all, { bucket: "none", search: "" })).toEqual([none]);
    expect(filterPatients(all, { bucket: "all", search: "  MARI " })).toEqual([
      med,
    ]);
    const withMrn = makePatient({
      id: "q",
      full_name: "Q",
      mrn: "MRN-0042",
      risk_level: "low",
    });
    expect(
      filterPatients([withMrn], { bucket: "all", search: "0042" })
    ).toEqual([withMrn]);
  });

  it("combines both", () => {
    expect(filterPatients(all, { bucket: "low", search: "hina" })).toEqual([]);
  });
});
