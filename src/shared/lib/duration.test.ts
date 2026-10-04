import { describe, expect, it } from "vitest";

import { formatDuration } from "./duration";

describe("formatDuration", () => {
  it("breaks time into months, weeks, days, hours, minutes and seconds", () => {
    const s = 30 * 86400 + 2 * 7 * 86400 + 3 * 86400 + 4 * 3600 + 5 * 60 + 6;
    expect(formatDuration(s)).toBe("1mo 2w 3d 4h 5m 6s");
  });

  it("leaves out units that are zero", () => {
    expect(formatDuration(2 * 3600 + 5)).toBe("2h 5s");
    expect(formatDuration(7 * 86400)).toBe("1w");
    expect(formatDuration(26 * 60 + 3)).toBe("26m 3s");
    expect(formatDuration(59)).toBe("59s");
  });

  it("reads as 0s for nothing, bad input and negatives", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(null)).toBe("0s");
    expect(formatDuration(undefined)).toBe("0s");
    expect(formatDuration(Number.NaN)).toBe("0s");
    expect(formatDuration(-90)).toBe("0s");
  });

  it("rounds to whole seconds", () => {
    expect(formatDuration(90.6)).toBe("1m 31s");
  });

  it("matches the backend wherever the backend can express it", () => {
    // format_duration(): "26m 3s", "1h 15m 8s", "7d 4h 45m 12s" — the
    // backend adds zero inner units ("1h 0m 5s"); here they are dropped.
    expect(formatDuration(1 * 3600 + 15 * 60 + 8)).toBe("1h 15m 8s");
    expect(formatDuration(7 * 86400 + 4 * 3600 + 45 * 60 + 12)).toBe(
      "1w 4h 45m 12s"
    );
  });
});
