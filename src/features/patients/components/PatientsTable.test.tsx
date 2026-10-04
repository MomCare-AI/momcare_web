import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { makePatient } from "../testFixtures";
import { PatientsTable } from "./PatientsTable";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/features/monitoring/hooks/useMonitoring", () => ({
  useDevices: () => ({ data: [] }),
}));

afterEach(cleanup);

describe("patient list formats", () => {
  it("shows gestational age as months, weeks and days", () => {
    render(
      <PatientsTable
        initialSearch=""
        patients={[
          makePatient({
            gestational_age_display: "30w 2d",
            gestational_age_long_display: "7 months 2 weeks 2 days",
          }),
        ]}
      />
    );
    expect(screen.getByText("7 months 2 weeks 2 days")).toBeTruthy();
    expect(screen.queryByText("30w 2d")).toBeNull();
  });

  it("formats a pregnancy under a month in weeks and days, not the 3w 5d shorthand", () => {
    render(
      <PatientsTable
        initialSearch=""
        patients={[
          makePatient({
            gestational_age_display: "3w 5d",
            gestational_age_long_display: "3w 5d",
          }),
        ]}
      />
    );
    expect(screen.getByText("3 weeks 5 days")).toBeTruthy();
  });

  it("shows monitoring time from the seconds, to the unit the backend lacks", () => {
    const eightDays = 8 * 86400 + 3 * 3600 + 5 * 60 + 9;
    render(
      <PatientsTable
        initialSearch=""
        patients={[
          makePatient({
            monitoring_seconds_this_month: eightDays,
            monitoring_time_display: "8d 3h 5m 9s",
          }),
        ]}
      />
    );
    expect(screen.getByText("1w 1d 3h 5m 9s")).toBeTruthy();
    expect(screen.queryByText("8d 3h 5m 9s")).toBeNull();
  });
});
