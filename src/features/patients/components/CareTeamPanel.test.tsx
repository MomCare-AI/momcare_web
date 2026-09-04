/**
 * The care team panel: additive to the one lead clinician, never a
 * replacement for that assignment. `canWrite` here only hides a button —
 * the server re-checks the same rule on every request — but ending a
 * membership must still require a real confirmation step, since removing
 * someone from a patient's care team is not a click to take back lightly.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CareTeamPanel } from "./CareTeamPanel";
import {
  useAddCareTeamMember,
  useCareTeam,
  useClinicians,
  useEndCareTeamMembership,
} from "@/features/patients/hooks/usePatients";
import type { CareTeamMembership } from "@/features/patients/types";

vi.mock("@/features/patients/hooks/usePatients", () => ({
  useCareTeam: vi.fn(),
  useClinicians: vi.fn(),
  useAddCareTeamMember: vi.fn(),
  useEndCareTeamMembership: vi.fn(),
}));

const mockedUseCareTeam = vi.mocked(useCareTeam);
const mockedUseClinicians = vi.mocked(useClinicians);
const mockedUseAddCareTeamMember = vi.mocked(useAddCareTeamMember);
const mockedUseEndCareTeamMembership = vi.mocked(useEndCareTeamMembership);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function member(
  overrides: Partial<CareTeamMembership> = {}
): CareTeamMembership {
  return {
    id: "m1",
    staff: "s1",
    staff_name: "Hina Baloch",
    role: "nurse",
    role_display: "Nurse",
    is_active: true,
    started_at: "2026-09-01T00:00:00Z",
    ended_at: null,
    ...overrides,
  };
}

function stubDefaults() {
  mockedUseClinicians.mockReturnValue({
    data: [{ id: "c1", full_name: "Dr. Sana Iqbal", role_name: "Provider" }],
  } as unknown as ReturnType<typeof useClinicians>);
  mockedUseAddCareTeamMember.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useAddCareTeamMember>);
  mockedUseEndCareTeamMembership.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useEndCareTeamMembership>);
}

function team(data: CareTeamMembership[] | undefined, extra: object = {}) {
  mockedUseCareTeam.mockReturnValue({
    data,
    isError: false,
    isSuccess: true,
    ...extra,
  } as unknown as ReturnType<typeof useCareTeam>);
}

const baseProps = {
  patientId: "p1",
  pregnancyId: "preg1",
  leadProviderName: "Dr. Sana Iqbal",
  leadProviderActive: true,
};

describe("CareTeamPanel", () => {
  it("shows the lead clinician read-only, and says when nobody is assigned", () => {
    stubDefaults();
    team([]);
    render(
      <CareTeamPanel {...baseProps} leadProviderName="" canWrite={false} />
    );
    screen.getByText("Not yet assigned");
  });

  it("flags a lead clinician who is no longer active, rather than showing them as current", () => {
    stubDefaults();
    team([]);
    render(
      <CareTeamPanel
        {...baseProps}
        leadProviderActive={false}
        canWrite={false}
      />
    );
    screen.getByText("Dr. Sana Iqbal (no longer active)");
  });

  it("distinguishes a failed load from a genuinely empty team", () => {
    stubDefaults();
    team(undefined, { isError: true, isSuccess: false });
    render(<CareTeamPanel {...baseProps} canWrite={false} />);
    screen.getByText("The care team could not be loaded.");
    expect(screen.queryByText("No supporting members yet")).toBeNull();
  });

  it("shows the true empty state only once the request succeeded with no members", () => {
    stubDefaults();
    team([]);
    render(<CareTeamPanel {...baseProps} canWrite={false} />);
    screen.getByText("No supporting members yet");
  });

  it("filters out ended memberships — only active members are shown", () => {
    stubDefaults();
    team([
      member({ id: "active", staff_name: "Active Nurse", is_active: true }),
      member({ id: "ended", staff_name: "Former Nurse", is_active: false }),
    ]);
    render(<CareTeamPanel {...baseProps} canWrite={false} />);
    screen.getByText("Active Nurse");
    expect(screen.queryByText("Former Nurse")).toBeNull();
  });

  it("hides Add member and End for a caller without write access", () => {
    stubDefaults();
    team([member()]);
    render(<CareTeamPanel {...baseProps} canWrite={false} />);
    expect(screen.queryByText("Add member")).toBeNull();
    expect(screen.queryByText("End")).toBeNull();
  });

  it("lets a writer open the add-member form and submit it", () => {
    stubDefaults();
    const mutate = vi.fn();
    mockedUseAddCareTeamMember.mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAddCareTeamMember>);
    team([]);

    render(<CareTeamPanel {...baseProps} canWrite />);
    fireEvent.click(screen.getByText("Add member"));

    fireEvent.change(screen.getByLabelText("Staff member"), {
      target: { value: "c1" },
    });
    fireEvent.click(screen.getByText("Add to care team"));

    expect(mutate).toHaveBeenCalledWith(
      { staff: "c1", role: "nurse" },
      expect.anything()
    );
  });

  it("cannot submit the add-member form without a staff member selected", () => {
    stubDefaults();
    team([]);
    render(<CareTeamPanel {...baseProps} canWrite />);
    fireEvent.click(screen.getByText("Add member"));

    const submit = screen.getByText("Add to care team") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it("requires a confirmation click before ending a membership - not a single accidental click", () => {
    stubDefaults();
    const mutate = vi.fn();
    mockedUseEndCareTeamMembership.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useEndCareTeamMembership>);
    team([member({ id: "m9" })]);

    render(<CareTeamPanel {...baseProps} canWrite />);
    fireEvent.click(screen.getByText("End"));
    // Still hasn't happened - only the confirmation prompt appeared.
    expect(mutate).not.toHaveBeenCalled();
    screen.getByText("Remove from care team?");

    fireEvent.click(screen.getByText("Confirm"));
    expect(mutate).toHaveBeenCalledWith("m9", expect.anything());
  });

  it("cancelling the confirmation leaves the membership untouched", () => {
    stubDefaults();
    const mutate = vi.fn();
    mockedUseEndCareTeamMembership.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useEndCareTeamMembership>);
    team([member({ id: "m9" })]);

    render(<CareTeamPanel {...baseProps} canWrite />);
    fireEvent.click(screen.getByText("End"));
    fireEvent.click(screen.getByText("Cancel"));

    expect(mutate).not.toHaveBeenCalled();
    expect(screen.queryByText("Remove from care team?")).toBeNull();
  });
});
