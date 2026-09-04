/**
 * Enrolment: the one screen where a wrong default can quietly hide risk.
 * "Unknown if it wasn't asked" is a named rule on the form itself — a
 * checkbox that turns "nobody asked" into "no" is exactly the failure
 * mode this project's own conventions call out. Consent is a hard gate,
 * not a courtesy: the form must refuse to enrol without it.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import EnrolPatientPage from "./page";
import { usePortal } from "../../layout";
import {
  useClinicians,
  useEnrolPatient,
} from "@/features/patients/hooks/usePatients";
import { SessionExpiredError } from "@/core/api/authFetch";
import type { OrgSummary } from "@/features/portal/hooks/usePortalData";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));
vi.mock("../../layout", () => ({ usePortal: vi.fn() }));
vi.mock("@/features/patients/hooks/usePatients", () => ({
  useClinicians: vi.fn(),
  useEnrolPatient: vi.fn(),
}));

const mockedUsePortal = vi.mocked(usePortal);
const mockedUseClinicians = vi.mocked(useClinicians);
const mockedUseEnrolPatient = vi.mocked(useEnrolPatient);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function setup({
  clinicians = [
    { id: "c1", full_name: "Dr. Sana Iqbal", role_name: "Provider" },
  ],
  mutateAsync = vi.fn().mockResolvedValue({ id: "p1" }),
}: {
  clinicians?: { id: string; full_name: string; role_name: string }[];
  mutateAsync?: ReturnType<typeof vi.fn>;
} = {}) {
  mockedUsePortal.mockReturnValue({
    org: { name: "Nur Care Maternity" } as OrgSummary,
  } as unknown as ReturnType<typeof usePortal>);
  mockedUseClinicians.mockReturnValue({
    data: clinicians,
  } as unknown as ReturnType<typeof useClinicians>);
  mockedUseEnrolPatient.mockReturnValue({
    mutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useEnrolPatient>);
  return { mutateAsync };
}

/**
 * The generic Field wrapper renders its label as a plain sibling of the
 * input, not an associated <label for>, so getByLabelText can't reach
 * these — a real accessibility gap, flagged separately rather than fixed
 * here. This walks from the label text to the control beside it instead.
 */
function fieldInput(labelPattern: RegExp): HTMLElement {
  const label = screen.getByText(labelPattern);
  const control = label.parentElement?.querySelector("input, select, textarea");
  if (!control)
    throw new Error(`No control found next to label ${labelPattern}`);
  return control as HTMLElement;
}

function fillRequired() {
  fireEvent.change(fieldInput(/^First name/), {
    target: { value: "Ayesha" },
  });
}

function checkConsent() {
  fireEvent.click(screen.getByLabelText(/I confirm the patient has consented/));
}

describe("EnrolPatientPage", () => {
  it("defaults every risk factor to Unknown, never No — nobody asked is not the same as no", () => {
    setup();
    render(<EnrolPatientPage />);

    const unknownButtons = screen
      .getAllByRole("button", { pressed: true })
      .filter((b) => b.textContent === "Unknown");
    // 7 risk factors, all defaulting to the pressed "Unknown" segment.
    expect(unknownButtons.length).toBe(7);
  });

  it("disables submission until consent is actually given", () => {
    setup();
    render(<EnrolPatientPage />);

    const submit = screen.getByRole("button", {
      name: /Enrol patient/,
    }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    checkConsent();
    expect(submit.disabled).toBe(false);
  });

  it("refuses to submit without a dating source when recording a pregnancy", async () => {
    const { mutateAsync } = setup();
    render(<EnrolPatientPage />);

    fillRequired();
    checkConsent();
    fireEvent.click(screen.getByRole("button", { name: /Enrol patient/ }));

    await screen.findByText(
      /last menstrual period or an estimated delivery date/
    );
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("skips the dating requirement entirely when not recording a pregnancy now", async () => {
    const { mutateAsync } = setup();
    render(<EnrolPatientPage />);

    fillRequired();
    checkConsent();
    fireEvent.click(screen.getByLabelText("Record a pregnancy now"));
    fireEvent.click(screen.getByRole("button", { name: /Enrol patient/ }));

    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    const payload = mutateAsync.mock.calls[0][0];
    expect(payload.pregnancy).toBeUndefined();
  });

  it("only sends an EDD the user actually typed, letting the server derive it otherwise", async () => {
    const { mutateAsync } = setup();
    render(<EnrolPatientPage />);

    fillRequired();
    checkConsent();
    fireEvent.change(fieldInput(/^Last menstrual period/), {
      target: { value: "2026-06-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enrol patient/ }));

    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    const payload = mutateAsync.mock.calls[0][0];
    expect(payload.pregnancy.lmp).toBe("2026-06-01");
    expect(payload.pregnancy.edd).toBeNull();
  });

  it("sends the risk factors exactly as answered, unknown included", async () => {
    const { mutateAsync } = setup();
    render(<EnrolPatientPage />);

    fillRequired();
    checkConsent();
    fireEvent.change(fieldInput(/^Last menstrual period/), {
      target: { value: "2026-06-01" },
    });

    const group = screen.getByRole("group", { name: "Chronic hypertension" });
    const yesInGroup = group.querySelector(
      "button[aria-pressed]:first-child"
    ) as HTMLElement;
    fireEvent.click(yesInGroup);

    fireEvent.click(screen.getByRole("button", { name: /Enrol patient/ }));

    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    const payload = mutateAsync.mock.calls[0][0];
    expect(payload.pregnancy.risk_factors.chronic_hypertension).toBe("yes");
    expect(payload.pregnancy.risk_factors.diabetes).toBe("unknown");
  });

  it("warns when no lead clinician is assigned, since nobody would be accountable", () => {
    setup();
    render(<EnrolPatientPage />);
    screen.getByText(/Without a lead clinician, nobody is accountable/);
  });

  it("clears the no-clinician warning once one is selected", () => {
    setup();
    render(<EnrolPatientPage />);

    fireEvent.change(screen.getByLabelText("Lead clinician"), {
      target: { value: "c1" },
    });
    expect(
      screen.queryByText(/Without a lead clinician, nobody is accountable/)
    ).toBeNull();
  });

  it("tells the hospital to invite staff first when none exist yet", () => {
    setup({ clinicians: [] });
    render(<EnrolPatientPage />);
    screen.getByText(/No clinical staff have joined yet/);
  });

  it("navigates to the new patient's page on success", async () => {
    const { mutateAsync } = setup();
    render(<EnrolPatientPage />);

    fillRequired();
    checkConsent();
    fireEvent.click(screen.getByLabelText("Record a pregnancy now"));
    fireEvent.click(screen.getByRole("button", { name: /Enrol patient/ }));

    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dashboard/patients/p1?enrolled=1")
    );
  });

  it("sends an expired session to login rather than showing a generic error", async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new SessionExpiredError());
    setup({ mutateAsync });
    render(<EnrolPatientPage />);

    fillRequired();
    checkConsent();
    fireEvent.click(screen.getByLabelText("Record a pregnancy now"));
    fireEvent.click(screen.getByRole("button", { name: /Enrol patient/ }));

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});
