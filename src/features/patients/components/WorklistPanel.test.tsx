/**
 * The worklist panel: administrative/care-continuity gaps, deliberately a
 * different question from clinical severity. Its four states must stay
 * distinct - an error must never read as "nothing outstanding," the same
 * discipline the Attention Queue already holds itself to.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorklistPanel } from "./WorklistPanel";
import { useWorklist } from "../hooks/usePatients";
import type { WorklistPatient } from "../types";

vi.mock("../hooks/usePatients", () => ({
  useWorklist: vi.fn(),
}));

const mockedUseWorklist = vi.mocked(useWorklist);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function row(overrides: Partial<WorklistPatient> = {}): WorklistPatient {
  return {
    patient_id: "p1",
    pregnancy_id: "preg1",
    full_name: "Ayesha Bibi",
    gestational_age: "28w",
    reasons: [
      { code: "no_recent_reading", detail: "No reading in 9 days.", days: 9 },
    ],
    ...overrides,
  };
}

describe("WorklistPanel", () => {
  it("shows a loading state, not an empty worklist, while the request is in flight", () => {
    mockedUseWorklist.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    } as unknown as ReturnType<typeof useWorklist>);

    render(<WorklistPanel assignedToMe={false} />);
    screen.getByText("Loading worklist…");
  });

  it("distinguishes a failed load from nothing being outstanding", () => {
    mockedUseWorklist.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    } as unknown as ReturnType<typeof useWorklist>);

    render(<WorklistPanel assignedToMe={false} />);
    screen.getByText("Worklist unavailable");
    expect(screen.queryByText("Nothing outstanding")).toBeNull();
  });

  it("shows the genuine empty state only once the request actually succeeded with no rows", () => {
    mockedUseWorklist.mockReturnValue({
      data: { count: 0, results: [] },
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useWorklist>);

    render(<WorklistPanel assignedToMe={false} />);
    screen.getByText("Nothing outstanding");
  });

  it("renders a row with its name, gestational age, and every reason", () => {
    mockedUseWorklist.mockReturnValue({
      data: {
        count: 1,
        results: [
          row({
            reasons: [
              {
                code: "no_recent_reading",
                detail: "No reading in 9 days.",
                days: 9,
              },
              {
                code: "no_lead_clinician",
                detail: "No lead clinician assigned.",
                days: null,
              },
            ],
          }),
        ],
      },
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useWorklist>);

    render(<WorklistPanel assignedToMe={false} />);
    screen.getByText("Ayesha Bibi");
    screen.getByText("28w");
    screen.getByText("No reading in 9 days.");
    screen.getByText("No lead clinician assigned.");
    screen.getByText("2 outstanding");
  });

  it("passes assignedToMe through to the query", () => {
    mockedUseWorklist.mockReturnValue({
      data: { count: 0, results: [] },
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useWorklist>);

    render(<WorklistPanel assignedToMe={true} />);
    expect(mockedUseWorklist).toHaveBeenCalledWith(true);
  });
});
