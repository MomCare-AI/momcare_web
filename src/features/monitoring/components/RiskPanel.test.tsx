/**
 * The panel a clinician actually reads to decide whether to act.
 *
 * Three things it must never do, per its own docstring: show a level
 * without the readings behind it, present the rules engine as if it were
 * the AI model, or let an unreviewed critical assessment look the same as
 * one a clinician has already seen. These tests hold each of those.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RiskPanel } from "./RiskPanel";
import {
  useAcknowledgeRisk,
  useReassessRisk,
  useRiskHistory,
} from "../hooks/useMonitoring";
import type { RiskAssessment, RiskHistory } from "../types";

vi.mock("../hooks/useMonitoring", () => ({
  useRiskHistory: vi.fn(),
  useAcknowledgeRisk: vi.fn(),
  useReassessRisk: vi.fn(),
}));

const mockedUseRiskHistory = vi.mocked(useRiskHistory);
const mockedUseAcknowledgeRisk = vi.mocked(useAcknowledgeRisk);
const mockedUseReassessRisk = vi.mocked(useReassessRisk);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function assessment(overrides: Partial<RiskAssessment> = {}): RiskAssessment {
  return {
    id: "ra1",
    level: "high",
    level_display: "High",
    previous_level: "",
    findings: [
      {
        code: "bp_high",
        level: "high",
        detail: "Elevated blood pressure",
        reading_id: "r1",
      },
    ],
    reasons: ["Elevated blood pressure"],
    source: "rules",
    source_display: "Clinical rules",
    engine_version: "1.0",
    score: null,
    confidence: null,
    assessed_at: "2026-09-04T10:00:00Z",
    needs_acknowledgement: true,
    acknowledged_at: null,
    acknowledged_by_name: "",
    ...overrides,
  };
}

function stubMutations() {
  mockedUseAcknowledgeRisk.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useAcknowledgeRisk>);
  mockedUseReassessRisk.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    data: undefined,
  } as unknown as ReturnType<typeof useReassessRisk>);
}

function history(data: Partial<RiskHistory>) {
  mockedUseRiskHistory.mockReturnValue({
    data: { current: null, history: [], ...data },
    isPending: false,
  } as unknown as ReturnType<typeof useRiskHistory>);
}

describe("RiskPanel", () => {
  it("shows a loading state, never an empty verdict, while the request is in flight", () => {
    stubMutations();
    mockedUseRiskHistory.mockReturnValue({
      data: undefined,
      isPending: true,
    } as unknown as ReturnType<typeof useRiskHistory>);

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText("Loading assessment…");
  });

  it("never invents a level when nobody has been assessed yet", () => {
    stubMutations();
    history({ current: null, history: [] });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText("Not assessed yet");
    expect(screen.queryByText("Stable")).toBeNull();
    expect(screen.queryByText("Critical")).toBeNull();
  });

  it("shows a level only alongside its badge, never text alone", () => {
    stubMutations();
    history({
      current: assessment({ level: "critical", level_display: "Critical" }),
    });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText("Critical");
  });

  it("lists the findings behind the level, not just the level itself", () => {
    stubMutations();
    history({ current: assessment() });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText("Elevated blood pressure");
  });

  it("says findings are absent, not that the patient was examined and found well", () => {
    stubMutations();
    history({ current: assessment({ findings: [], reasons: [] }) });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText(/not that the patient has been\s*examined/);
  });

  it("attributes the rules engine plainly, never presenting it as the AI model", () => {
    stubMutations();
    history({ current: assessment({ source: "rules" }) });

    render(<RiskPanel pregnancyId="preg1" />);
    expect(screen.getAllByText("Clinical rules").length).toBeGreaterThan(0);
    expect(screen.queryByText("AI model")).toBeNull();
  });

  it("labels a model-produced assessment as decision support, not a diagnosis", () => {
    stubMutations();
    history({
      current: assessment({ source: "model", engine_version: "2.1" }),
    });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText("AI model");
    screen.getByText(/Decision support only — never a diagnosis/);
  });

  it("shows the transition when the level actually changed", () => {
    stubMutations();
    history({
      current: assessment({
        level: "critical",
        level_display: "Critical",
        previous_level: "high",
      }),
    });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText(/Changed from/);
  });

  it("offers to acknowledge an unreviewed assessment, and calls the mutation with its id", () => {
    const mutate = vi.fn();
    mockedUseAcknowledgeRisk.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useAcknowledgeRisk>);
    mockedUseReassessRisk.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      data: undefined,
    } as unknown as ReturnType<typeof useReassessRisk>);
    history({
      current: assessment({ id: "ra9", needs_acknowledgement: true }),
    });

    render(<RiskPanel pregnancyId="preg1" />);
    fireEvent.click(screen.getByText("Acknowledge — I have reviewed this"));
    expect(mutate).toHaveBeenCalledWith("ra9");
  });

  it("an unreviewed critical assessment must not read the same as a reviewed one", () => {
    stubMutations();
    history({
      current: assessment({
        needs_acknowledgement: true,
        acknowledged_at: null,
      }),
    });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText("Acknowledge — I have reviewed this");
    expect(screen.queryByText(/Reviewed by/)).toBeNull();
  });

  it("shows who reviewed it and when, once acknowledged", () => {
    stubMutations();
    history({
      current: assessment({
        needs_acknowledgement: false,
        acknowledged_at: "2026-09-04T11:00:00Z",
        acknowledged_by_name: "Dr. Sana Iqbal",
      }),
    });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText(/Reviewed by Dr\. Sana Iqbal on/);
    expect(screen.queryByText("Acknowledge — I have reviewed this")).toBeNull();
  });

  it("falls back to a clinician when the reviewer's name is unavailable", () => {
    stubMutations();
    history({
      current: assessment({
        needs_acknowledgement: false,
        acknowledged_at: "2026-09-04T11:00:00Z",
        acknowledged_by_name: "",
      }),
    });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText(/Reviewed by a clinician on/);
  });

  it("shows past transitions only when there is more than the current one", () => {
    stubMutations();
    history({
      current: assessment(),
      history: [assessment({ id: "cur" })],
    });

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
          level: "moderate",
          level_display: "Moderate",
          reasons: ["Returned to range."],
        }),
      ],
    });

    render(<RiskPanel pregnancyId="preg1" />);
    screen.getByText("Earlier changes");
  });
});
