/**
 * The monitoring surface for one pregnancy. Its own docstring states the
 * rule that matters most here: silence is the failure mode, so a missing
 * vital must render as visibly absent — never as a normal-looking value —
 * and a stale one must be called out, not left to blend in.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VitalsPanel } from "./VitalsPanel";
import {
  useLatestReadings,
  useReadings,
  useRecordReading,
} from "../hooks/useMonitoring";
import type { VitalReading } from "../types";

vi.mock("../hooks/useMonitoring", () => ({
  useReadings: vi.fn(),
  useRecordReading: vi.fn(),
  useLatestReadings: vi.fn(),
}));

vi.mock("./VitalsChart", () => ({
  VitalsChart: () => <div data-testid="vitals-chart" />,
}));

const mockedUseReadings = vi.mocked(useReadings);
const mockedUseLatestReadings = vi.mocked(useLatestReadings);
const mockedUseRecordReading = vi.mocked(useRecordReading);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function reading(overrides: Partial<VitalReading> = {}): VitalReading {
  return {
    id: "r1",
    age: null,
    systolic_bp: "120",
    diastolic_bp: "80",
    heart_rate: null,
    body_temp_f: null,
    hemoglobin: null,
    blood_glucose: null,
    stress_score: null,
    phys_activity_score: null,
    source: "manual",
    source_display: "Manual entry",
    recorded_at: new Date().toISOString(),
    device: null,
    ...overrides,
  };
}

/** No last contact by default; individual tests opt in. */
function stubContact(reading: VitalReading | null = null) {
  mockedUseLatestReadings.mockReturnValue({
    data: { reading, total_count: reading ? 1 : 0 },
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useLatestReadings>);
}

function stubRecord(mutateAsync = vi.fn().mockResolvedValue(undefined)) {
  stubContact();
  mockedUseRecordReading.mockReturnValue({
    mutateAsync,
    isPending: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useRecordReading>);
  return mutateAsync;
}

function series(results: VitalReading[], count = results.length) {
  mockedUseReadings.mockReturnValue({
    data: { results, count },
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useReadings>);
}

describe("VitalsPanel", () => {
  it("shows a loading state while the readings are in flight", () => {
    stubRecord();
    mockedUseReadings.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    } as unknown as ReturnType<typeof useReadings>);

    render(<VitalsPanel pregnancyId="preg1" />);
    screen.getByText("Loading readings…");
  });

  it("a failed load must not read as no readings recorded", () => {
    stubRecord();
    mockedUseReadings.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    } as unknown as ReturnType<typeof useReadings>);

    render(<VitalsPanel pregnancyId="preg1" />);
    screen.getByText("Readings unavailable");
    expect(screen.queryByText("No readings yet")).toBeNull();
  });

  it("shows the true empty state only once nothing has ever been recorded", () => {
    stubRecord();
    series([]);

    render(<VitalsPanel pregnancyId="preg1" />);
    expect(screen.getAllByText("No readings yet").length).toBeGreaterThan(0);
  });

  it("renders an unmeasured vital as visibly absent, never a normal-looking value", () => {
    stubRecord();
    series([reading()]);

    render(<VitalsPanel pregnancyId="preg1" />);
    // Only blood pressure was recorded. The other four metrics each say so
    // rather than showing a blank, a zero, or another vital's number.
    expect(screen.getAllByText("Not measured").length).toBe(4);
  });

  it("finds a vital in an older event rather than reporting it unmeasured", () => {
    stubRecord();
    // The newest event carries only a heart rate; hemoglobin came from a lab
    // report weeks earlier and is still the most recent one there is.
    series([
      reading({
        id: "new",
        systolic_bp: null,
        diastolic_bp: null,
        heart_rate: "88",
      }),
      reading({
        id: "old",
        systolic_bp: null,
        diastolic_bp: null,
        hemoglobin: "10.4",
      }),
    ]);

    render(<VitalsPanel pregnancyId="preg1" />);
    screen.getByText("10.4 g/dL");
  });

  it("calls out a stale reading rather than letting it look current", () => {
    stubRecord();
    series([
      reading({
        recorded_at: new Date(Date.now() - 15 * 3600 * 1000).toISOString(),
      }),
    ]);

    render(<VitalsPanel pregnancyId="preg1" />);
    screen.getByText(/h ago/);
  });

  it("renders the chart once the selected vital actually has a series", () => {
    stubRecord();
    series([reading()]);

    render(<VitalsPanel pregnancyId="preg1" />);
    screen.getByTestId("vitals-chart");
  });

  it("says the selected vital has none rather than showing an empty chart", () => {
    stubRecord();
    // A heart rate exists, so the panel is not empty — but blood pressure,
    // which is selected by default, was never measured.
    series([
      reading({ systolic_bp: null, diastolic_bp: null, heart_rate: "88" }),
    ]);

    render(<VitalsPanel pregnancyId="preg1" />);
    screen.getByText(/No blood pressure recorded\./);
  });

  it("submits only the vitals that were actually filled in", async () => {
    const mutateAsync = stubRecord();
    series([]);

    render(<VitalsPanel pregnancyId="preg1" />);
    fireEvent.click(screen.getByText("Record reading"));
    fireEvent.change(screen.getByLabelText(/Systolic BP/), {
      target: { value: "130" },
    });
    fireEvent.change(screen.getByLabelText(/Diastolic BP/), {
      target: { value: "85" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Record reading/ }));

    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    // A blank field is left unrecorded, not sent as zero — a fabricated
    // normal reading is worse than an absent one.
    expect(mutateAsync).toHaveBeenCalledWith({
      systolic_bp: 130,
      diastolic_bp: 85,
    });
  });

  it("surfaces the reason the server rejected a reading, not a generic failure", () => {
    stubContact();
    mockedUseRecordReading.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error("Systolic pressure must be higher than diastolic."),
    } as unknown as ReturnType<typeof useRecordReading>);
    series([]);

    render(<VitalsPanel pregnancyId="preg1" />);
    fireEvent.click(screen.getByText("Record reading"));
    screen.getByText("Systolic pressure must be higher than diastolic.");
  });

  it("reports last contact separately from each vital's own age", () => {
    stubRecord();
    // The band has been silent for 15 hours, but blood pressure still has a
    // perfectly good value from back then. Only the contact line can say the
    // patient has stopped reporting.
    const old = new Date(Date.now() - 15 * 3600 * 1000).toISOString();
    stubContact(reading({ recorded_at: old }));
    series([reading({ recorded_at: old })]);

    render(<VitalsPanel pregnancyId="preg1" />);
    screen.getByText(/last contact/);
  });

  it("says nothing about contact when the patient has never reported", () => {
    stubRecord();
    series([]);

    render(<VitalsPanel pregnancyId="preg1" />);
    expect(screen.queryByText(/last contact/)).toBeNull();
  });
});
