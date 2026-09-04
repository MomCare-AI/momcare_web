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
  type RiskAssessment,
} from "./types";

describe("riskLabel", () => {
  it("never assessed is its own label, not stable", () => {
    expect(riskLabel(null)).toBe("Not assessed");
    expect(riskLabel(null)).not.toBe(riskLabel("stable"));
  });

  it("labels every real level in words", () => {
    expect(riskLabel("stable")).toBe("Stable");
    expect(riskLabel("moderate")).toBe("Moderate");
    expect(riskLabel("high")).toBe("High");
    expect(riskLabel("critical")).toBe("Critical");
  });
});

describe("riskBadgeClass", () => {
  it("falls back to neutral, not stable's colour, when never assessed", () => {
    expect(riskBadgeClass(null)).toBe("mc-badge mc-badge-neutral");
    expect(riskBadgeClass(null)).not.toContain("stable");
  });

  it("carries the level in the class for every real level", () => {
    expect(riskBadgeClass("critical")).toBe("mc-badge mc-badge-critical");
    expect(riskBadgeClass("high")).toBe("mc-badge mc-badge-high");
  });
});

describe("riskRank / isActionable", () => {
  it("orders severity stable < moderate < high < critical", () => {
    expect(riskRank("stable")).toBeLessThan(riskRank("moderate"));
    expect(riskRank("moderate")).toBeLessThan(riskRank("high"));
    expect(riskRank("high")).toBeLessThan(riskRank("critical"));
  });

  it("never-assessed ranks below stable, not level with it", () => {
    expect(riskRank(null)).toBeLessThan(riskRank("stable"));
  });

  it("only above-stable levels are actionable", () => {
    expect(isActionable("stable")).toBe(false);
    expect(isActionable("moderate")).toBe(true);
    expect(isActionable("high")).toBe(true);
    expect(isActionable("critical")).toBe(true);
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

describe("assessmentSource", () => {
  const base: RiskAssessment = {
    id: "a1",
    level: "high",
    level_display: "High",
    previous_level: "moderate",
    findings: [],
    reasons: [],
    source: "rules",
    source_display: "Clinical rules",
    engine_version: "1.0",
    score: null,
    confidence: null,
    assessed_at: "2026-09-04T12:00:00Z",
    needs_acknowledgement: true,
    acknowledged_at: null,
    acknowledged_by_name: "",
  };

  it("attributes the rules engine plainly, never inventing a score", () => {
    expect(assessmentSource(base)).toBe("Clinical rules");
  });

  it("attributes a model with its version and confidence when present", () => {
    expect(
      assessmentSource({
        ...base,
        source: "model",
        engine_version: "2.1",
        confidence: "0.87",
      })
    ).toBe("AI model 2.1 · 87% confidence");
  });

  it("attributes a model without confidence, still never fabricating one", () => {
    expect(
      assessmentSource({ ...base, source: "model", engine_version: "2.1" })
    ).toBe("AI model 2.1");
  });
});
