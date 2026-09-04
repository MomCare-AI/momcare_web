/**
 * The deadline math a clinician's escalation countdown is built on. A
 * missing next rung has to render as absent, never as "0m" — that's the
 * difference between "nothing more will happen" and "something is about
 * to."
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { raisedAgo, timeToEscalation } from "./types";

describe("timeToEscalation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null rather than a fake countdown when there is no next rung", () => {
    expect(timeToEscalation(null)).toBeNull();
  });

  it("treats a past or now deadline as escalating now, and imminent", () => {
    expect(
      timeToEscalation(new Date("2026-09-04T11:59:00Z").toISOString())
    ).toEqual({ text: "escalating now", imminent: true });
  });

  it("flags imminent inside 5 minutes, not before", () => {
    expect(
      timeToEscalation(new Date("2026-09-04T12:05:00Z").toISOString())
    ).toEqual({ text: "escalates in 5m", imminent: true });
    expect(
      timeToEscalation(new Date("2026-09-04T12:06:00Z").toISOString())
    ).toEqual({ text: "escalates in 6m", imminent: false });
  });

  it("reads in hours once past 60 minutes", () => {
    expect(
      timeToEscalation(new Date("2026-09-04T15:00:00Z").toISOString())
    ).toEqual({ text: "escalates in 3h", imminent: false });
  });
});

describe("raisedAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads just now under a minute", () => {
    expect(raisedAgo(new Date("2026-09-04T11:59:30Z").toISOString())).toBe(
      "just now"
    );
  });

  it("reads in minutes under an hour", () => {
    expect(raisedAgo(new Date("2026-09-04T11:40:00Z").toISOString())).toBe(
      "20m ago"
    );
  });

  it("reads in hours under a day", () => {
    expect(raisedAgo(new Date("2026-09-04T06:00:00Z").toISOString())).toBe(
      "6h ago"
    );
  });

  it("reads in days once past 24h", () => {
    expect(raisedAgo(new Date("2026-09-02T12:00:00Z").toISOString())).toBe(
      "2d ago"
    );
  });
});
