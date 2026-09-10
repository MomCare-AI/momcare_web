/**
 * The list a clinician's shift starts from.
 *
 * Its four states are deliberately distinct: "loading", "the server refused
 * to say" and "nothing to review" must never collapse into one blank screen
 * — an error rendering as an empty queue would tell a clinician nobody
 * needs them when the truth is the system just doesn't know.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AttentionQueue } from "./AttentionQueue";
import { useAttentionQueue } from "../hooks/useMonitoring";
import type { AttentionPatient } from "../types";

vi.mock("../hooks/useMonitoring", () => ({
  useAttentionQueue: vi.fn(),
}));

vi.mock("motion/react", () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children, ...rest }: { children?: React.ReactNode }) => (
          <div {...rest}>{children}</div>
        ),
    }
  ),
}));

const mockedUseAttentionQueue = vi.mocked(useAttentionQueue);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function row(overrides: Partial<AttentionPatient> = {}): AttentionPatient {
  return {
    patient_id: "p1",
    pregnancy_id: "preg1",
    full_name: "Ayesha Bibi",
    mrn: "MRN-1",
    gestational_age: "28w",
    risk_level: "high",
    risk_level_display: "High",
    assessed_at: new Date().toISOString(),
    needs_review: true,
    assigned_staff_name: "Dr. Sana Iqbal",
    has_responsible_clinician: true,
    ...overrides,
  };
}

describe("AttentionQueue", () => {
  it("shows a loading state, not an empty queue, while the request is in flight", () => {
    mockedUseAttentionQueue.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    } as ReturnType<typeof useAttentionQueue>);

    render(<AttentionQueue />);
    screen.getByText("Loading queue…");
  });

  it("distinguishes a failed load from nothing needing review", () => {
    mockedUseAttentionQueue.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    } as ReturnType<typeof useAttentionQueue>);

    render(<AttentionQueue />);
    screen.getByText("Queue unavailable");
    expect(screen.queryByText("Nothing to review")).toBeNull();
  });

  it("shows the genuine empty state only once the request actually succeeded with no rows", () => {
    mockedUseAttentionQueue.mockReturnValue({
      data: { results: [] as AttentionPatient[] },
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAttentionQueue>);

    render(<AttentionQueue />);
    screen.getByText("Nothing to review");
  });

  it("distinguishes a level filter with no matches from a truly empty queue", () => {
    mockedUseAttentionQueue.mockReturnValue({
      data: { results: [row({ risk_level: "low" })] },
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAttentionQueue>);

    render(<AttentionQueue level="high" />);
    screen.getByText("None at this level");
  });

  it("renders a row with its risk badge, review state, and assigned clinician", () => {
    mockedUseAttentionQueue.mockReturnValue({
      data: { results: [row()] },
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAttentionQueue>);

    render(<AttentionQueue />);
    screen.getByText("Ayesha Bibi");
    screen.getByText("High");
    screen.getByText("MRN-1");
    // An unjudged row has to say so — the queue looking attended to when
    // nobody has reviewed anything is the failure this list exists to prevent.
    screen.getByText("Awaiting review");
    screen.getByText("Dr. Sana Iqbal");
  });

  it("calls out a patient with no responsible clinician instead of leaving it blank", () => {
    mockedUseAttentionQueue.mockReturnValue({
      data: { results: [row({ has_responsible_clinician: false })] },
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAttentionQueue>);

    render(<AttentionQueue />);
    screen.getByText("No clinician");
    expect(screen.queryByText("Dr. Sana Iqbal")).toBeNull();
  });

  it("filters to only the requested level", () => {
    mockedUseAttentionQueue.mockReturnValue({
      data: {
        results: [
          row({
            pregnancy_id: "p-high",
            risk_level: "high",
            full_name: "High Patient",
          }),
          row({
            pregnancy_id: "p-medium",
            risk_level: "medium",
            full_name: "Medium Patient",
          }),
        ],
      },
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAttentionQueue>);

    render(<AttentionQueue level="high" />);
    screen.getByText("High Patient");
    expect(screen.queryByText("Medium Patient")).toBeNull();
  });

  it("reports how many more rows are hidden beyond the limit", () => {
    mockedUseAttentionQueue.mockReturnValue({
      data: {
        results: [
          row({ pregnancy_id: "p1" }),
          row({ pregnancy_id: "p2" }),
          row({ pregnancy_id: "p3" }),
        ],
      },
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAttentionQueue>);

    render(<AttentionQueue limit={1} />);
    screen.getByText(/2 more patients needing attention/);
  });

  it("suppresses the more-footer when the page already states the total", () => {
    mockedUseAttentionQueue.mockReturnValue({
      data: {
        results: [row({ pregnancy_id: "p1" }), row({ pregnancy_id: "p2" })],
      },
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAttentionQueue>);

    render(<AttentionQueue limit={1} hideMore />);
    expect(screen.queryByText(/more patient/)).toBeNull();
  });
});
