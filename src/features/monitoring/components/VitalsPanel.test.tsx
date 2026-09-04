/**
 * The monitoring surface for one pregnancy. Its own docstring states the
 * rule that matters most here: silence is the failure mode, so a missing
 * reading must render as visibly absent — never as a normal-looking value
 * — and a stale one must be called out, not left to blend in.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VitalsPanel } from "./VitalsPanel";
import {
  useLatestReadings,
  useReadings,
  useRecordReading,
  useSimulateReadings,
} from "../hooks/useMonitoring";
import type { LatestReadings, VitalReading } from "../types";

vi.mock("../hooks/useMonitoring", () => ({
  useLatestReadings: vi.fn(),
  useReadings: vi.fn(),
  useRecordReading: vi.fn(),
  useSimulateReadings: vi.fn(),
}));

vi.mock("./VitalsChart", () => ({
  VitalsChart: () => <div data-testid="vitals-chart" />,
}));

const mockedUseLatestReadings = vi.mocked(useLatestReadings);
const mockedUseReadings = vi.mocked(useReadings);
const mockedUseRecordReading = vi.mocked(useRecordReading);
const mockedUseSimulateReadings = vi.mocked(useSimulateReadings);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function reading(overrides: Partial<VitalReading> = {}): VitalReading {
  return {
    id: "r1",
    reading_type: "blood_pressure",
    reading_type_display: "Blood pressure",
    value: "120",
    value_secondary: "80",
    display_value: "120/80",
    unit: "mmHg",
    recorded_at: new Date().toISOString(),
    source: "manual",
    source_display: "Manual",
    is_simulated: false,
    device: null,
    ...overrides,
  };
}

function stubDefaults() {
  mockedUseRecordReading.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useRecordReading>);
  mockedUseSimulateReadings.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useSimulateReadings>);
  mockedUseReadings.mockReturnValue({
    data: { results: [] },
    isPending: false,
  } as unknown as ReturnType<typeof useReadings>);
}

function latest(data: Partial<LatestReadings>) {
  mockedUseLatestReadings.mockReturnValue({
    data: { readings: {}, total_count: 0, ...data },
    isPending: false,
  } as unknown as ReturnType<typeof useLatestReadings>);
}

describe("VitalsPanel", () => {
  it("shows a loading state while the latest readings are in flight", () => {
    stubDefaults();
    mockedUseLatestReadings.mockReturnValue({
      data: undefined,
      isPending: true,
    } as unknown as ReturnType<typeof useLatestReadings>);

    render(<VitalsPanel pregnancyId="preg1" />);
    screen.getByText("Loading readings…");
  });

  it("shows the true empty state only once nothing has ever been recorded", () => {
    stubDefaults();
    latest({ readings: {}, total_count: 0 });

    render(<VitalsPanel pregnancyId="preg1" />);
    expect(screen.getAllByText("No readings yet").length).toBeGreaterThan(0);
  });

  it("renders a missing vital as visibly absent, never a normal-looking value", () => {
    stubDefaults();
    latest({
      readings: { blood_pressure: reading() },
      total_count: 1,
    });

    render(<VitalsPanel pregnancyId="preg1" />);
    // Heart rate and temperature were never recorded - each shows its own
    // dash and "No reading", not a blank space or a stale copy of another value.
    const missing = screen.getAllByText("No reading");
    expect(missing.length).toBe(2);
  });

  it("calls out a stale reading rather than letting it look current", () => {
    stubDefaults();
    latest({
      readings: {
        blood_pressure: reading({
          recorded_at: new Date(Date.now() - 15 * 3600 * 1000).toISOString(),
        }),
      },
      total_count: 1,
    });

    render(<VitalsPanel pregnancyId="preg1" />);
    screen.getByText(/h ago/);
  });

  it("tags a simulated reading so it can't be mistaken for a real measurement", () => {
    stubDefaults();
    latest({
      readings: { blood_pressure: reading({ is_simulated: true }) },
      total_count: 1,
    });

    render(<VitalsPanel pregnancyId="preg1" />);
    screen.getByText("sim");
  });

  it("shows a chart-loading state distinct from the panel's own loading state", () => {
    latest({
      readings: { blood_pressure: reading() },
      total_count: 1,
    });
    mockedUseRecordReading.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRecordReading>);
    mockedUseSimulateReadings.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useSimulateReadings>);
    mockedUseReadings.mockReturnValue({
      data: undefined,
      isPending: true,
    } as unknown as ReturnType<typeof useReadings>);

    render(<VitalsPanel pregnancyId="preg1" />);
    screen.getByText("Loading chart…");
  });

  it("renders the chart once the selected type actually has a series", () => {
    stubDefaults();
    latest({ readings: { blood_pressure: reading() }, total_count: 1 });
    mockedUseReadings.mockReturnValue({
      data: { results: [reading()] },
      isPending: false,
    } as unknown as ReturnType<typeof useReadings>);

    render(<VitalsPanel pregnancyId="preg1" />);
    screen.getByTestId("vitals-chart");
  });

  it("says no readings for the selected type rather than showing an empty chart", () => {
    stubDefaults();
    latest({ readings: { blood_pressure: reading() }, total_count: 1 });

    render(<VitalsPanel pregnancyId="preg1" />);
    screen.getByText(/No blood pressure readings recorded\./);
  });

  it("hides the simulate control when the caller disallows it", () => {
    stubDefaults();
    latest({ readings: {}, total_count: 0 });

    render(<VitalsPanel pregnancyId="preg1" allowSimulation={false} />);
    expect(screen.queryByText("Simulate 24h")).toBeNull();
  });

  it("calls the simulate mutation with the fixed 24h/not-elevated arguments", () => {
    stubDefaults();
    const mutate = vi.fn();
    mockedUseSimulateReadings.mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useSimulateReadings>);
    latest({ readings: {}, total_count: 0 });

    render(<VitalsPanel pregnancyId="preg1" />);
    fireEvent.click(screen.getByText("Simulate 24h"));
    expect(mutate).toHaveBeenCalledWith({ hours: 24, elevated: false });
  });

  it("opens the manual entry form, and requires diastolic only for blood pressure", () => {
    stubDefaults();
    latest({ readings: {}, total_count: 0 });

    render(<VitalsPanel pregnancyId="preg1" />);
    fireEvent.click(screen.getByText("Record reading"));
    screen.getByLabelText(/Diastolic/);

    fireEvent.change(screen.getByLabelText("Measurement"), {
      target: { value: "heart_rate" },
    });
    expect(screen.queryByLabelText(/Diastolic/)).toBeNull();
  });

  it("submits a manual reading and closes the form on success", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mockedUseRecordReading.mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRecordReading>);
    mockedUseSimulateReadings.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useSimulateReadings>);
    mockedUseReadings.mockReturnValue({
      data: { results: [] },
      isPending: false,
    } as unknown as ReturnType<typeof useReadings>);
    latest({ readings: {}, total_count: 0 });

    render(<VitalsPanel pregnancyId="preg1" />);
    fireEvent.click(screen.getByText("Record reading"));
    fireEvent.change(screen.getByLabelText(/Systolic/), {
      target: { value: "130" },
    });
    fireEvent.change(screen.getByLabelText(/Diastolic/), {
      target: { value: "85" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Record reading/ }));

    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith({
      reading_type: "blood_pressure",
      value: "130",
      value_secondary: "85",
    });
  });
});
