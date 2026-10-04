import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PatientHeaderBanner } from "./PatientHeaderBanner";
import type { PatientDetail } from "../types";

vi.mock("../hooks/usePatients", () => ({
  usePatientStatuses: () => ({
    data: [
      { id: "1", name: "Stable", description: "Doing well", color: "#2f8a72" },
      { id: "2", name: "Follow up", description: "", color: "#d65f58" },
    ],
  }),
}));
vi.mock("./EditStatusesModal", () => ({
  EditStatusesModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">statuses popup</div> : null,
}));
vi.mock("./LogSessionModal", () => ({ LogSessionModal: () => null }));

const patient = {
  id: "p1",
  full_name: "TestWizard Debug",
  date_of_birth: null,
  phone: "",
  gender: "",
  mrn: null,
  cnic: "",
  location_name: "Main Branch",
  created_at: "2026-10-01T00:00:00Z",
} as unknown as PatientDetail;

const renderBanner = (canEditStatuses?: boolean) =>
  render(
    <PatientHeaderBanner
      patient={patient}
      current={null}
      seconds={0}
      setSeconds={vi.fn()}
      running={false}
      setRunning={vi.fn()}
      canEditStatuses={canEditStatuses}
    />
  );

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("patient header statuses", () => {
  it("shows the patient's statuses next to her name", () => {
    renderBanner(true);
    const pills = screen.getAllByRole("listitem");
    expect(pills.map((p) => p.textContent)).toEqual(["Stable", "Follow up"]);
  });

  it("has an Edit button that opens the statuses popup", () => {
    renderBanner(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Edit statuses" }));
    expect(screen.getByRole("dialog").textContent).toBe("statuses popup");
  });

  it("hides the Edit button for someone who may not edit, but still shows the statuses", () => {
    renderBanner(false);
    expect(screen.queryByRole("button", { name: "Edit statuses" })).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
