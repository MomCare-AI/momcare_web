/**
 * The badge that carries a patient's clinical state everywhere it appears.
 * The one rule that must never break: colour alone never speaks — every
 * level has to carry its word too, so the badge survives a colour-blind
 * reader and a black-and-white printout.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RiskBadge } from "./RiskBadge";

afterEach(cleanup);

describe("RiskBadge", () => {
  it.each([
    ["stable", "Stable"],
    ["moderate", "Moderate"],
    ["high", "High"],
    ["critical", "Critical"],
  ] as const)(
    "shows the word %s alongside the icon, not colour alone",
    (level, label) => {
      render(<RiskBadge level={level} />);
      screen.getByText(label);
    }
  );

  it("never assessed reads as its own state, not as stable", () => {
    render(<RiskBadge level={null} />);
    screen.getByText("Not assessed");
    expect(screen.queryByText("Stable")).toBeNull();
  });

  it("flags an unacknowledged assessment with an accessible label, not colour alone", () => {
    render(<RiskBadge level="critical" unacknowledged />);
    screen.getByLabelText("Not yet reviewed");
  });

  it("says nothing was missed when the assessment has been reviewed", () => {
    render(<RiskBadge level="critical" unacknowledged={false} />);
    expect(screen.queryByLabelText("Not yet reviewed")).toBeNull();
  });
});
