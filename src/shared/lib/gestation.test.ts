import { describe, expect, it } from "vitest";

import { formatGestationalAge, longFromDays } from "./gestation";

describe("formatGestationalAge", () => {
  it("shows the backend's long form when it has one", () => {
    expect(formatGestationalAge("30w 2d", "7 months 2 weeks 2 days")).toBe(
      "7 months 2 weeks 2 days"
    );
  });

  it("formats the short form the same way the backend does", () => {
    // 30w 2d = 212 days = 7 months (196) + 16 days = 2 weeks 2 days
    expect(formatGestationalAge("30w 2d")).toBe("7 months 2 weeks 2 days");
    expect(formatGestationalAge("28w 0d")).toBe("7 months");
    expect(formatGestationalAge("40w 0d")).toBe("10 months");
  });

  it("uses weeks and days under one month, singular when it is one", () => {
    expect(formatGestationalAge("3w 5d")).toBe("3 weeks 5 days");
    expect(formatGestationalAge("1w 1d")).toBe("1 week 1 day");
    expect(formatGestationalAge("4w")).toBe("1 month");
    expect(formatGestationalAge("0w 0d")).toBe("0 days");
  });

  it("falls back to the short form's own long when only that exists", () => {
    // The backend returns "3w 5d" for under a month; we normalise it.
    expect(formatGestationalAge("3w 5d", "3w 5d")).toBe("3 weeks 5 days");
  });

  it("never invents a value", () => {
    expect(formatGestationalAge(null)).toBe("—");
    expect(formatGestationalAge("")).toBe("—");
    expect(formatGestationalAge("unknown")).toBe("unknown");
  });

  it("agrees with the backend rule for every day of a pregnancy", () => {
    // 28-day months: day 280 is exactly 10 months.
    expect(longFromDays(280)).toBe("10 months");
    expect(longFromDays(27)).toBe("3 weeks 6 days");
    expect(longFromDays(28)).toBe("1 month");
  });
});

import { briefFromDays, formatGestationalAgeBrief } from "./gestation";

describe("brief gestational age", () => {
  it("shows days under a week, weeks under a month, months beyond", () => {
    expect(briefFromDays(4)).toBe("4 days");
    expect(briefFromDays(1)).toBe("1 day");
    expect(briefFromDays(7)).toBe("1 week");
    expect(briefFromDays(27)).toBe("3 weeks");
    expect(briefFromDays(28)).toBe("1 month");
    expect(briefFromDays(9 * 28 + 24)).toBe("9 months");
  });

  it("reads the short form and leaves unparseable text alone", () => {
    expect(formatGestationalAgeBrief("30w 2d")).toBe("7 months");
    expect(formatGestationalAgeBrief("3w 5d")).toBe("3 weeks");
    expect(formatGestationalAgeBrief(null)).toBe("—");
  });
});
