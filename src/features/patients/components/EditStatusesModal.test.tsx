import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EditStatusesModal } from "./EditStatusesModal";
import type { PatientStatusEntry } from "../types";

let isHospitalAdmin = false;
vi.mock("@/app/(portal)/dashboard/portal", () => ({
  usePortal: () => ({ user: { id: "u-me" }, isHospitalAdmin }),
}));

const labels = vi.fn();
vi.mock("@/features/statuses/hooks/useStatuses", () => ({
  useStatusLabels: () => labels(),
}));

const statuses = vi.fn();
const add = vi.fn();
const remove = vi.fn();
vi.mock("../hooks/usePatients", () => ({
  usePatientStatuses: () => statuses(),
  useAddPatientStatus: () => ({ mutateAsync: add }),
  useRemovePatientStatus: () => ({ mutateAsync: remove }),
}));

const label = (name: string, color = "#2f8a72") => ({
  id: name,
  name,
  description: `${name} means something`,
  color,
});

const entry = (name: string, addedBy: string): PatientStatusEntry => ({
  id: `e-${name}`,
  patient: "p1",
  patient_name: "Test",
  pregnancy: null,
  name,
  description: "",
  color: "#d65f58",
  added_by: addedBy,
  added_by_name: addedBy,
  created_at: "",
  updated_at: "",
});

const onClose = vi.fn();
const renderModal = () =>
  render(
    <EditStatusesModal
      open
      onClose={onClose}
      patientId="p1"
      patientName="TestWizard Debug"
    />
  );

const dialog = () => screen.getByRole("dialog");
const chip = (name: string) =>
  within(dialog()).getByRole("checkbox", { name: new RegExp(name, "i") });
const save = () =>
  within(dialog()).getByRole("button", { name: /^save/i }) as HTMLButtonElement;

beforeEach(() => {
  isHospitalAdmin = false;
  labels.mockReturnValue({
    isPending: false,
    data: {
      results: [label("Stable"), label("Follow up"), label("Awaiting labs")],
    },
  });
  statuses.mockReturnValue({
    isPending: false,
    data: [entry("Stable", "u-me")],
  });
  add.mockReset().mockResolvedValue({});
  remove.mockReset().mockResolvedValue(undefined);
  onClose.mockReset();
});
afterEach(cleanup);

describe("Edit statuses popup", () => {
  it("shows the hospital's statuses with the patient's current ones ticked", () => {
    renderModal();
    expect(within(dialog()).getByText("TestWizard Debug")).toBeTruthy();
    expect(chip("Stable").getAttribute("aria-checked")).toBe("true");
    expect(chip("Follow up").getAttribute("aria-checked")).toBe("false");
    expect(chip("Awaiting labs").getAttribute("aria-checked")).toBe("false");
    // Nothing to save until something changes.
    expect(save().disabled).toBe(true);
    expect(within(dialog()).getByText("No changes")).toBeTruthy();
  });

  it("adds what was ticked and removes what was unticked, only on Save", async () => {
    renderModal();
    fireEvent.click(chip("Follow up"));
    fireEvent.click(chip("Stable"));
    expect(within(dialog()).getByText("2 changes")).toBeTruthy();
    expect(add).not.toHaveBeenCalled(); // nothing happens until Save

    fireEvent.click(save());
    await waitFor(() => expect(onClose).toHaveBeenCalled());

    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith({
      name: "Follow up",
      description: "Follow up means something",
      color: "#2f8a72",
    });
    expect(remove).toHaveBeenCalledWith("e-Stable");
  });

  it("locks a status someone else added, but lets a hospital admin remove it", () => {
    statuses.mockReturnValue({
      isPending: false,
      data: [entry("Stable", "u-other")],
    });
    renderModal();
    expect((chip("Stable") as HTMLButtonElement).disabled).toBe(true);

    cleanup();
    isHospitalAdmin = true;
    renderModal();
    expect((chip("Stable") as HTMLButtonElement).disabled).toBe(false);
  });

  it("keeps the popup open and says what failed, when one change is refused", async () => {
    remove.mockRejectedValue(new Error("403"));
    renderModal();
    fireEvent.click(chip("Stable"));
    fireEvent.click(chip("Follow up"));
    fireEvent.click(save());

    expect(await within(dialog()).findByRole("alert")).toBeTruthy();
    expect(within(dialog()).getByRole("alert").textContent).toContain(
      'remove "Stable"'
    );
    expect(onClose).not.toHaveBeenCalled();
    // The change that did work was still made.
    expect(add).toHaveBeenCalledTimes(1);
  });

  it("still lists a status whose catalogue entry was deleted, so it can be removed", () => {
    statuses.mockReturnValue({
      isPending: false,
      data: [entry("Retired status", "u-me")],
    });
    renderModal();
    expect(chip("Retired status").getAttribute("aria-checked")).toBe("true");
  });

  it("shows a placeholder while loading, and explains an empty catalogue", () => {
    labels.mockReturnValue({ isPending: true, data: undefined });
    renderModal();
    expect(within(dialog()).getByText("Loading statuses…")).toBeTruthy();
    expect(save().disabled).toBe(true);

    cleanup();
    labels.mockReturnValue({ isPending: false, data: { results: [] } });
    statuses.mockReturnValue({ isPending: false, data: [] });
    renderModal();
    expect(within(dialog()).getByText("No statuses defined yet")).toBeTruthy();
    expect(
      within(dialog()).getByText(/Ask your hospital administrator/)
    ).toBeTruthy();
  });
});
