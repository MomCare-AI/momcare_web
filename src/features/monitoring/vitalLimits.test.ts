import { describe, expect, it } from "vitest";

import { checkVitalValues } from "./vitalLimits";

describe("checkVitalValues", () => {
  it("accepts a normal and a dangerous-but-possible set", () => {
    expect(
      checkVitalValues({
        systolic_bp: "120",
        diastolic_bp: "80",
        heart_rate: "72",
      })
    ).toBeNull();
    // 200/120 is a crisis, and must still be recordable so it can be scored.
    expect(
      checkVitalValues({ systolic_bp: "200", diastolic_bp: "120" })
    ).toBeNull();
  });

  it("rejects impossible values", () => {
    expect(checkVitalValues({ body_temp_f: "986" })).toMatch(/between/);
    expect(checkVitalValues({ heart_rate: "5" })).toMatch(/between/);
    expect(checkVitalValues({ hemoglobin: "99" })).toMatch(/between/);
  });

  it("rejects negatives, letters and exponents", () => {
    expect(checkVitalValues({ heart_rate: "-70" })).toMatch(/number/);
    expect(checkVitalValues({ heart_rate: "abc" })).toMatch(/number/);
    expect(checkVitalValues({ heart_rate: "1e3" })).toMatch(/number/);
  });

  it("needs something entered", () => {
    expect(checkVitalValues({})).toMatch(/at least one/);
    expect(checkVitalValues({ heart_rate: "  " })).toMatch(/at least one/);
  });

  it("needs both halves of a blood pressure, systolic above diastolic", () => {
    expect(checkVitalValues({ systolic_bp: "120" })).toMatch(/both/);
    expect(checkVitalValues({ diastolic_bp: "80" })).toMatch(/both/);
    expect(
      checkVitalValues({ systolic_bp: "80", diastolic_bp: "120" })
    ).toMatch(/lower than/);
  });

  it("keeps stress and activity on their 0 to 10 scale", () => {
    expect(checkVitalValues({ stress_score: "11" })).toMatch(/between/);
    expect(checkVitalValues({ stress_score: "7.5" })).toBeNull();
  });
});
