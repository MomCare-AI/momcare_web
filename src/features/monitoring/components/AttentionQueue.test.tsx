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
    level: "high",
    level_display: "High",
    reasons: ["Elevated blood pressure"],
    assessed_at: new Date().toISOString(),
    needs_acknowledgement: true,
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
      data: { results: [row({ level: "high" })] },
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAttentionQueue>);

    render(<AttentionQueue level="critical" />);
    screen.getByText("None at this level");
  });

  it("renders a row with its risk badge, reasons, and assigned clinician", () => {
    mockedUseAttentionQueue.mockReturnValue({
      data: { results: [row()] },
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAttentionQueue>);

    render(<AttentionQueue />);
    screen.getByText("Ayesha Bibi");
    screen.getByText("High");
    screen.getByText("Elevated blood pressure");
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
            pregnancy_id: "p-critical",
            level: "critical",
            full_name: "Critical Patient",
          }),
          row({
            pregnancy_id: "p-moderate",
            level: "moderate",
            full_name: "Moderate Patient",
          }),
        ],
      },
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAttentionQueue>);

    render(<AttentionQueue level="critical" />);
    screen.getByText("Critical Patient");
    expect(screen.queryByText("Moderate Patient")).toBeNull();
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
