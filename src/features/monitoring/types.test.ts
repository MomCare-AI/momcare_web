/**
 * The rules that keep a clinical screen honest: "not assessed" must never
 * read as "stable", and every risk level must carry a word, not just a
 * colour — see RiskBadge and the portal's own "colour is reserved for
 * clinical state, never decoration" rule.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  assessmentSource,
  isActionable,
  readingAge,
  riskBadgeClass,
  riskLabel,
  riskRank,
  vitalValue,
  latestForMetric,
  assessmentCategories,
  canonicalLevel,
  type RiskAssessment,
  type VitalReading,
} from "./types";

describe("riskLabel", () => {
  it("never assessed is its own label, not low", () => {
    expect(riskLabel(null)).toBe("Not assessed");
    expect(riskLabel(null)).not.toBe(riskLabel("low"));
  });

  it("labels every real level in words", () => {
    expect(riskLabel("low")).toBe("Low");
    expect(riskLabel("medium")).toBe("Medium");
    expect(riskLabel("high")).toBe("High");
  });
});

describe("riskBadgeClass", () => {
  it("falls back to neutral, not low's colour, when never assessed", () => {
    expect(riskBadgeClass(null)).toBe("mc-badge mc-badge-neutral");
    expect(riskBadgeClass(null)).not.toContain("low");
  });

  it("carries the level in the class for every real level", () => {
    expect(riskBadgeClass("high")).toBe("mc-badge mc-badge-high");
    expect(riskBadgeClass("medium")).toBe("mc-badge mc-badge-medium");
  });
});

describe("riskRank / isActionable", () => {
  it("orders severity low < medium < high", () => {
    expect(riskRank("low")).toBeLessThan(riskRank("medium"));
    expect(riskRank("medium")).toBeLessThan(riskRank("high"));
  });

  it("never-assessed ranks below low, not level with it", () => {
    expect(riskRank(null)).toBeLessThan(riskRank("low"));
  });

  it("only above-low levels are actionable", () => {
    expect(isActionable("low")).toBe(false);
    expect(isActionable("medium")).toBe(true);
    expect(isActionable("high")).toBe(true);
    expect(isActionable(null)).toBe(false);
  });
});

describe("readingAge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads as just now under a minute old", () => {
    expect(readingAge(new Date("2026-09-04T11:59:30Z").toISOString())).toEqual({
      text: "just now",
      stale: false,
    });
  });

  it("reads in minutes under an hour, not yet stale", () => {
    expect(readingAge(new Date("2026-09-04T11:45:00Z").toISOString())).toEqual({
      text: "15 min ago",
      stale: false,
    });
  });

  it("reads in hours, and turns stale at 12h — silence must not look calm", () => {
    expect(readingAge(new Date("2026-09-04T05:00:00Z").toISOString())).toEqual({
      text: "7h ago",
      stale: false,
    });
    expect(readingAge(new Date("2026-09-03T23:00:00Z").toISOString())).toEqual({
      text: "13h ago",
      stale: true,
    });
  });

  it("reads in days once past 24h, always stale", () => {
    expect(readingAge(new Date("2026-09-01T12:00:00Z").toISOString())).toEqual({
      text: "3d ago",
      stale: true,
    });
  });
});

function reading(overrides: Partial<VitalReading> = {}): VitalReading {
  return {
    id: "r1",
    age: null,
    systolic_bp: null,
    diastolic_bp: null,
    heart_rate: null,
    body_temp_f: null,
    hemoglobin: null,
    blood_glucose: null,
    stress_score: null,
    phys_activity_score: null,
    source: "manual",
    source_display: "Manual entry",
    recorded_at: "2026-09-04T12:00:00Z",
    device: null,
    ...overrides,
  };
}

function assessment(overrides: Partial<RiskAssessment> = {}): RiskAssessment {
  return {
    id: "ra1",
    risk_level: "high",
    risk_level_display: "High",
    final_risk_level: "high",
    final_risk_level_display: "High",
    previous_risk_level: "",
    confirmed_risk_level: "",
    review_status: "unreviewed",
    review_status_display: "Unreviewed",
    flagged_for_review: false,
    reading: null,
    bp_category: "",
    heart_rate_category: "",
    temperature_category: "",
    glucose_category: "",
    hemoglobin_category: "",
    confidence: null,
    assessed_at: "2026-09-04T12:00:00Z",
    needs_review: true,
    verified_at: null,
    verified_by_name: "",
    ...overrides,
  };
}

describe("vitalValue", () => {
  it("reads a decimal that arrived as a string", () => {
    expect(vitalValue(reading({ systolic_bp: "138.50" }), "systolic_bp")).toBe(
      138.5
    );
  });

  it("an unmeasured vital is null, never zero", () => {
    expect(vitalValue(reading(), "systolic_bp")).toBeNull();
    expect(vitalValue(reading({ systolic_bp: "" }), "systolic_bp")).toBeNull();
  });

  it("refuses a value that is not a number rather than charting NaN", () => {
    expect(
      vitalValue(reading({ heart_rate: "n/a" as string }), "heart_rate")
    ).toBeNull();
  });
});

describe("latestForMetric", () => {
  it("skips events that did not measure the vital, rather than reporting none", () => {
    const series = [
      reading({ id: "newest", heart_rate: "88" }),
      reading({ id: "older", hemoglobin: "10.4" }),
    ];
    const found = latestForMetric(series, "hemoglobin");
    expect(found?.reading.id).toBe("older");
    expect(found?.value).toBe(10.4);
  });

  it("pairs blood pressure with its diastolic half", () => {
    const found = latestForMetric(
      [reading({ systolic_bp: "142", diastolic_bp: "91" })],
      "blood_pressure"
    );
    expect(found?.value).toBe(142);
    expect(found?.secondary).toBe(91);
  });

  it("returns null when nothing in the series ever measured it", () => {
    expect(latestForMetric([reading({ heart_rate: "80" })], "hemoglobin")).toBe(
      null
    );
  });
});

describe("assessmentSource", () => {
  it("attributes the model without inventing a confidence it did not report", () => {
    expect(assessmentSource(assessment({ confidence: null }))).toBe("AI model");
  });

  it("states the confidence as a percentage when the model reported one", () => {
    expect(assessmentSource(assessment({ confidence: "0.87" }))).toBe(
      "AI model \u00B7 87% confidence"
    );
  });
});

describe("assessmentCategories", () => {
  it("drops unmeasured vitals rather than rendering blank as reassurance", () => {
    const rows = assessmentCategories(
      assessment({
        bp_category: "Stage 2 hypertension",
        heart_rate_category: "",
      })
    );
    expect(rows).toEqual([
      { label: "Blood pressure", value: "Stage 2 hypertension" },
    ]);
  });

  it("is empty when the model reported no breakdown at all", () => {
    expect(assessmentCategories(assessment())).toEqual([]);
  });
});

describe("canonicalLevel", () => {
  it("passes the model's own three levels straight through", () => {
    expect(canonicalLevel("low")).toBe("low");
    expect(canonicalLevel("medium")).toBe("medium");
    expect(canonicalLevel("high")).toBe("high");
  });

  it("folds the retired four-level names onto the three the model produces", () => {
    // Alert rows raised before the model landed still carry these. The
    // collapse is the backend's own: core/alerts/escalation.py states an
    // emergency finding is still reported as High.
    expect(canonicalLevel("stable")).toBe("low");
    expect(canonicalLevel("moderate")).toBe("medium");
    expect(canonicalLevel("critical")).toBe("high");
  });

  it("treats an unknown level as not assessed rather than guessing", () => {
    expect(canonicalLevel("banana")).toBeNull();
    expect(canonicalLevel(null)).toBeNull();
  });

  it("labels a legacy level readably instead of rendering nothing", () => {
    expect(riskLabel("critical" as never)).toBe("High");
    expect(riskBadgeClass("critical" as never)).toBe("mc-badge mc-badge-high");
  });
});
