import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makePatient } from "@/features/patients/testFixtures";
import { RiskOverview } from "./RiskOverview";

const usePatientList = vi.fn();
const useDashboardKpis = vi.fn();
vi.mock("@/features/patients/hooks/usePatients", () => ({
  usePatientList: (...args: unknown[]) => usePatientList(...args),
  useDashboardKpis: (...args: unknown[]) => useDashboardKpis(...args),
}));

let selectedLocationId: string | null = null;
vi.mock("@/features/locations/LocationScopeContext", () => ({
  useLocationScope: () => ({ selectedLocationId }),
}));

const patients = [
  makePatient({ id: "n", full_name: "Nida", risk_level: null }),
  makePatient({
    id: "h",
    full_name: "Hina",
    risk_level: "high",
    pending_risk_count: 2,
    mrn: "MRN-7",
    gestational_age_display: "30w 2d",
    gestational_age_long_display: "7 months 2 weeks 2 days",
  }),
  makePatient({ id: "l", full_name: "Lubna", risk_level: "low" }),
  makePatient({
    id: "m",
    full_name: "Mariam",
    risk_level: "medium",
    needs_low_confidence_review: true,
    pending_risk_count: 1,
  }),
];

beforeEach(() => {
  selectedLocationId = null;
  usePatientList.mockReturnValue({
    isPending: false,
    isError: false,
    data: { results: patients },
  });
  useDashboardKpis.mockReturnValue({
    data: { workflow: { risk_review: 3, low_confidence: 1 } },
  });
});
afterEach(() => {
  cleanup();
  usePatientList.mockReset();
  useDashboardKpis.mockReset();
});

const names = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((r) => within(r).getAllByRole("link")[0].textContent);

describe("Risk page", () => {
  it("lists patients highest risk first, with not-assessed last and apart from low", () => {
    render(<RiskOverview assignedToMe={false} />);
    expect(names()).toEqual(["Hina", "Mariam", "Lubna", "Nida"]);
    expect(screen.getAllByText("Not assessed").length).toBeGreaterThan(0);
  });

  it("shows how many are waiting, the low-confidence flag and the long gestational age", () => {
    render(<RiskOverview assignedToMe={false} />);
    expect(screen.getByText("2 pending")).toBeTruthy();
    expect(
      screen.getByText("Low confidence", { selector: "div" })
    ).toBeTruthy();
    expect(screen.getByText("7 months 2 weeks 2 days")).toBeTruthy();
    expect(screen.getByText("MRN-7")).toBeTruthy();
  });

  it("counts each level and filters when a level is chosen", () => {
    render(<RiskOverview assignedToMe={false} />);
    const high = screen.getByRole("button", { name: /High/ });
    expect(high.textContent).toContain("1");

    fireEvent.click(high);
    expect(names()).toEqual(["Hina"]);
    expect(high.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(high); // pressing again clears it
    expect(names()).toHaveLength(4);
  });

  it("searches by name", async () => {
    render(<RiskOverview assignedToMe={false} />);
    fireEvent.change(screen.getByLabelText("Search patients"), {
      target: { value: "lub" },
    });
    expect(await screen.findByText("Lubna")).toBeTruthy();
    await vi.waitFor(() => expect(names()).toEqual(["Lubna"]));
  });

  it("shows the review queue counts on the tabs and asks for that queue", () => {
    render(<RiskOverview assignedToMe={false} />);
    const needs = screen.getByRole("tab", { name: /Needs review/ });
    expect(needs.textContent).toContain("3");
    expect(
      screen.getByRole("tab", { name: /Low confidence/ }).textContent
    ).toContain("1");

    fireEvent.click(needs);
    const last = usePatientList.mock.calls.at(-1)!;
    expect(last[4]).toBe("risk_review"); // the workflow argument
  });

  it("follows the selected location for both the counts and the list", () => {
    selectedLocationId = "loc-9";
    render(<RiskOverview assignedToMe={false} />);
    expect(useDashboardKpis).toHaveBeenCalledWith("loc-9");
    expect(usePatientList.mock.calls[0][6]).toMatchObject({
      location: "loc-9",
      keepPreviousData: false,
    });
  });

  it("shows a skeleton while loading, not stale rows", () => {
    usePatientList.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    });
    render(<RiskOverview assignedToMe={false} />);
    expect(screen.getByText("Loading patients…")).toBeTruthy();
    expect(screen.queryByText("Hina")).toBeNull();
  });

  it("says plainly when a queue is empty, and offers to clear filters when a filter hides everyone", () => {
    usePatientList.mockReturnValue({
      isPending: false,
      isError: false,
      data: { results: [] },
    });
    render(<RiskOverview assignedToMe={false} />);
    expect(screen.getByText("No patients yet")).toBeTruthy();

    cleanup();
    usePatientList.mockReturnValue({
      isPending: false,
      isError: false,
      data: { results: patients },
    });
    render(<RiskOverview assignedToMe={false} />);
    fireEvent.change(screen.getByLabelText("Search patients"), {
      target: { value: "zzz" },
    });
    return vi.waitFor(() => {
      expect(screen.getByText("No patients match")).toBeTruthy();
      expect(
        screen.getByRole("button", { name: "Clear filters" })
      ).toBeTruthy();
    });
  });
});
