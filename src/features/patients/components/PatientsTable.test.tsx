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

  it("stacks every status of a patient, one above the other, with no +N", () => {
    render(
      <PatientsTable
        initialSearch=""
        patients={[
          makePatient({
            id: "a",
            full_name: "Has Statuses",
            statuses: [
              {
                name: "Enrolled",
                description: "On the programme",
                color: "#2f8a72",
              },
              { name: "PCM Fire", description: "", color: "#6b7280" },
              { name: "Prior Auth Pending", description: "", color: "#c98a2e" },
              { name: "Stable", description: "", color: "#2f8a72" },
            ],
          }),
          makePatient({ id: "b", full_name: "None", statuses: [] }),
        ]}
      />
    );
    expect(screen.getByRole("columnheader", { name: "Statuses" })).toBeTruthy();
    // All four are shown, in order, none hidden behind "+N".
    const pills = screen.getAllByRole("listitem");
    expect(pills.map((p) => p.textContent)).toEqual([
      "Enrolled",
      "PCM Fire",
      "Prior Auth Pending",
      "Stable",
    ]);
    // Stacked vertically, so the row grows with the number of statuses.
    const list = screen.getByRole("list", { name: "Statuses" });
    expect(list.style.flexDirection).toBe("column");
  });

  it("has a single statuses column, and shows no risk or pregnancy badge", () => {
    render(
      <PatientsTable
        initialSearch=""
        patients={[
          makePatient({
            id: "a",
            full_name: "High Risk",
            risk_level: "high",
            pregnancy_status: "active",
            statuses: [{ name: "Motion", description: "", color: "#d65f58" }],
          }),
          makePatient({
            id: "b",
            full_name: "No Pregnancy",
            risk_level: null,
            pregnancy_status: null,
          }),
        ]}
      />
    );

    // One column about statuses, not two.
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers.filter((h) => /status/i.test(h ?? ""))).toEqual([
      "Statuses",
    ]);

    // Risk lives on the Risk page; nothing but staff-added statuses appears here.
    expect(screen.queryByText("High")).toBeNull();
    expect(screen.queryByText("Not assessed")).toBeNull();
    expect(screen.queryByText("No pregnancy recorded")).toBeNull();
    expect(screen.queryByText("No active pregnancy")).toBeNull();
    expect(screen.getByText("Motion")).toBeTruthy();
  });
});
