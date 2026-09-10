/**
 * The panel a clinician actually reads to decide whether to act.
 *
 * Three things it must never do, per its own docstring: show a level without
 * the vitals behind it, present the model's raw answer as the one the system
 * acted on, or let an unreviewed high assessment look the same as one a
 * clinician has already judged. These tests hold each of those.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RiskPanel } from "./RiskPanel";
import {
  useReassessRisk,
  useRecordReading,
  useRiskHistory,
  useVerifyRisk,
} from "../hooks/useMonitoring";
import { useOrganization } from "@/features/portal/hooks/usePortalData";
import type { RiskAssessment, RiskHistory } from "../types";

vi.mock("@/features/portal/hooks/usePortalData", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("../hooks/useMonitoring", () => ({
  useRiskHistory: vi.fn(),
  useVerifyRisk: vi.fn(),
  useReassessRisk: vi.fn(),
  useRecordReading: vi.fn(),
}));

const mockedUseRiskHistory = vi.mocked(useRiskHistory);
const mockedUseVerifyRisk = vi.mocked(useVerifyRisk);
const mockedUseReassessRisk = vi.mocked(useReassessRisk);
const mockedUseRecordReading = vi.mocked(useRecordReading);
const mockedUseOrganization = vi.mocked(useOrganization);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

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
    bp_category: "Elevated blood pressure",
    heart_rate_category: "",
    temperature_category: "",
    glucose_category: "",
    hemoglobin_category: "",
    confidence: null,
    assessed_at: "2026-09-04T10:00:00Z",
    needs_review: true,
    verified_at: null,
    verified_by_name: "",
    ...overrides,
  };
}

function stubMutations(verifyMutate = vi.fn()) {
  mockedUseOrganization.mockReturnValue({
    data: { effective_confidence_threshold: "0.700" },
    isPending: false,
  } as unknown as ReturnType<typeof useOrganization>);
  mockedUseVerifyRisk.mockReturnValue({
    mutate: verifyMutate,
    isPending: false,
    error: null,
  } as unknown as ReturnType<typeof useVerifyRisk>);
  mockedUseReassessRisk.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    data: undefined,
  } as unknown as ReturnType<typeof useReassessRisk>);
  mockedUseRecordReading.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useRecordReading>);
}

function history(data: Partial<RiskHistory>) {
  mockedUseRiskHistory.mockReturnValue({
    data: { current: null, history: [], ...data },
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useRiskHistory>);
}

describe("RiskPanel", () => {
  it("shows a loading state, never an empty verdict, while the request is in flight", () => {
    stubMutations();
    mockedUseRiskHistory.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    } as unknown as ReturnType<typeof useRiskHistory>);

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText("Loading assessment…");
  });

  it("a failed load must not read as low risk", () => {
    stubMutations();
    mockedUseRiskHistory.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    } as unknown as ReturnType<typeof useRiskHistory>);

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText("Assessment unavailable");
    expect(screen.queryByText("Low")).toBeNull();
  });

  it("never invents a level when nobody has been assessed yet", () => {
    stubMutations();
    history({ current: null, history: [] });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText("Not assessed yet");
    expect(screen.queryByText("Low")).toBeNull();
  });

  it("lists the categories behind the level, not just the level itself", () => {
    stubMutations();
    history({ current: assessment() });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText(/Elevated blood pressure/);
  });

  it("says the breakdown is absent, not that every vital was in range", () => {
    stubMutations();
    history({ current: assessment({ bp_category: "" }) });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText(/not that every vital was in range/);
  });

  it("renders the level acted on, and says so when it differs from the model's answer", () => {
    stubMutations();
    history({
      current: assessment({ risk_level: "medium", final_risk_level: "high" }),
    });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText(/population adjustment raised it to/);
  });

  it("labels the assessment as decision support, not a diagnosis", () => {
    stubMutations();
    history({ current: assessment() });

    render(<RiskPanel pregnancyId="preg1" />);
    expect(screen.getAllByText("AI model").length).toBeGreaterThan(0);
    screen.getByText(/Decision support only — never a diagnosis/);
  });

  it("names both numbers when the model fell short of the hospital's threshold", () => {
    stubMutations();
    history({
      current: assessment({ flagged_for_review: true, confidence: "0.61" }),
    });

    render(<RiskPanel pregnancyId="preg1" />);
    // "Flagged" is only actionable if a clinician can see how far short it
    // fell, so both the confidence and the threshold have to be on screen.
    screen.getByText(/61% sure/);
    screen.getByText(/below this hospital's 70%/);
  });

  it("shows the transition when the level actually changed", () => {
    stubMutations();
    history({
      current: assessment({ previous_risk_level: "medium" }),
    });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText(/Changed from/);
  });

  it("confirming an unreviewed assessment sends the level the model settled on", () => {
    const mutate = vi.fn();
    stubMutations(mutate);
    history({ current: assessment({ id: "ra9", needs_review: true }) });

    render(<RiskPanel pregnancyId="preg1" />);
    fireEvent.click(screen.getByText("Confirm High"));
    expect(mutate).toHaveBeenCalledWith({
      assessmentId: "ra9",
      confirmedLevel: "high",
    });
  });

  it("a clinician can disagree and record a different level instead", () => {
    const mutate = vi.fn();
    stubMutations(mutate);
    history({ current: assessment({ id: "ra9", needs_review: true }) });

    render(<RiskPanel pregnancyId="preg1" />);
    fireEvent.click(screen.getByText("Disagree — correct it"));
    fireEvent.change(screen.getByLabelText("Corrected risk level"), {
      target: { value: "medium" },
    });
    fireEvent.click(screen.getByText("Record my judgement"));
    expect(mutate).toHaveBeenCalledWith({
      assessmentId: "ra9",
      confirmedLevel: "medium",
    });
  });

  it("an unreviewed assessment must not read the same as a reviewed one", () => {
    stubMutations();
    history({ current: assessment({ needs_review: true, verified_at: null }) });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText("Confirm High");
    expect(screen.queryByText(/Confirmed by/)).toBeNull();
  });

  it("offers no review control to someone who may not review — the server refuses it too", () => {
    stubMutations();
    history({ current: assessment({ needs_review: true }) });

    render(<RiskPanel pregnancyId="preg1" canVerify={false} />);
    expect(screen.queryByText("Confirm High")).toBeNull();
    screen.getByText(/Awaiting clinical review/);
  });

  it("shows who reviewed it and when, once verified", () => {
    stubMutations();
    history({
      current: assessment({
        needs_review: false,
        review_status: "confirmed",
        review_status_display: "Confirmed",
        confirmed_risk_level: "high",
        verified_at: "2026-09-04T11:00:00Z",
        verified_by_name: "Dr. Sana Iqbal",
      }),
    });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText(/Confirmed by Dr\. Sana Iqbal on/);
    expect(screen.queryByText("Confirm High")).toBeNull();
  });

  it("says so when a clinician corrected the model rather than agreeing", () => {
    stubMutations();
    history({
      current: assessment({
        needs_review: false,
        review_status: "corrected",
        review_status_display: "Corrected",
        final_risk_level: "high",
        confirmed_risk_level: "medium",
        verified_at: "2026-09-04T11:00:00Z",
        verified_by_name: "Dr. Sana Iqbal",
      }),
    });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText(/corrected to Medium/);
  });

  it("falls back to a clinician when the reviewer's name is unavailable", () => {
    stubMutations();
    history({
      current: assessment({
        needs_review: false,
        review_status_display: "Confirmed",
        verified_at: "2026-09-04T11:00:00Z",
        verified_by_name: "",
      }),
    });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText(/Confirmed by a clinician on/);
  });

  it("shows past transitions only when there is more than the current one", () => {
    stubMutations();
    history({ current: assessment(), history: [assessment({ id: "cur" })] });

    render(<RiskPanel pregnancyId="preg1" />);
    expect(screen.queryByText("Earlier changes")).toBeNull();
  });

  it("lists past transitions once there are earlier ones", () => {
    stubMutations();
    history({
      current: assessment({ id: "cur" }),
      history: [
        assessment({ id: "cur" }),
        assessment({
          id: "prev",
          final_risk_level: "medium",
          bp_category: "Returned to range.",
        }),
      ],
    });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText("Earlier changes");
  });
});
