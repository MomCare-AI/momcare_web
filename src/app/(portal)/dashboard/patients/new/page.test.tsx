/**
 * Enrolment: the one screen where a wrong default can quietly hide risk.
 * "Unknown if it wasn't asked" is a named rule on the form itself — a
 * checkbox that turns "nobody asked" into "no" is exactly the failure
 * mode this project's own conventions call out. Consent is recorded as a
 * date but is no longer a hard gate on submission — the backend made it
 * optional at onboarding (patients/migrations/0012).
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
    { id: "c1", full_name: "Dr. Sana Iqbal", role_code: "provider" },
  ],
  mutateAsync = vi.fn().mockResolvedValue({ id: "p1" }),
}: {
  clinicians?: { id: string; full_name: string; role_code: string }[];
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
  fireEvent.click(screen.getByLabelText(/has consented to MomCare/));
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

  it("submits without consent being checked — it's optional, not a gate, since the backend rebuild", async () => {
    const { mutateAsync } = setup();
    render(<EnrolPatientPage />);

    fillRequired();
    fireEvent.click(screen.getByLabelText("Record a pregnancy now"));
    const submit = screen.getByRole("button", {
      name: /Enrol patient/,
    }) as HTMLButtonElement;
    expect(submit.disabled).toBe(false);

    fireEvent.click(submit);

    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0].consent_date).toBeNull();
  });

  it("sends today's date when consent is checked", async () => {
    const { mutateAsync } = setup();
    render(<EnrolPatientPage />);

    fillRequired();
    checkConsent();
    fireEvent.click(screen.getByLabelText("Record a pregnancy now"));
    fireEvent.click(screen.getByRole("button", { name: /Enrol patient/ }));

    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    const today = new Date().toISOString().slice(0, 10);
    expect(mutateAsync.mock.calls[0][0].consent_date).toBe(today);
  });

  it("refuses to submit without a dating source when recording a pregnancy", async () => {
    const { mutateAsync } = setup();
    render(<EnrolPatientPage />);

    fillRequired();
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
    fireEvent.change(fieldInput(/^Last menstrual period/), {
      target: { value: "2026-06-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enrol patient/ }));

    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    const payload = mutateAsync.mock.calls[0][0];
    expect(payload.pregnancy.lmp).toBe("2026-06-01");
    expect(payload.pregnancy.edd).toBeNull();
  });

  it("sends the risk factors flat on the pregnancy object, unknown included", async () => {
    const { mutateAsync } = setup();
    render(<EnrolPatientPage />);

    fillRequired();
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
    // Flat on `pregnancy` itself — no nested `risk_factors` object any more.
    expect(payload.pregnancy.risk_factors).toBeUndefined();
    expect(payload.pregnancy.chronic_hypertension).toBe("yes");
    expect(payload.pregnancy.diabetes).toBe("unknown");
  });

  it("warns when no provider is assigned, since nobody would be the accountable lead", () => {
    setup();
    render(<EnrolPatientPage />);
    screen.getByText(/Without a provider, nobody is the accountable lead/);
  });

  it("clears the no-provider warning once one is selected", () => {
    setup();
    render(<EnrolPatientPage />);

    fireEvent.change(screen.getByLabelText("Provider"), {
      target: { value: "c1" },
    });
    expect(
      screen.queryByText(/Without a provider, nobody is the accountable lead/)
    ).toBeNull();
  });

  it("only lists staff whose role matches each care-team slot", () => {
    setup({
      clinicians: [
        { id: "c1", full_name: "Dr. Sana Iqbal", role_code: "provider" },
        { id: "c2", full_name: "Nurse Bilal", role_code: "nurse" },
      ],
    });
    render(<EnrolPatientPage />);

    const providerSelect = screen.getByLabelText(
      "Provider"
    ) as HTMLSelectElement;
    const nurseSelect = screen.getByLabelText("Nurse") as HTMLSelectElement;
    expect(
      Array.from(providerSelect.options).map((o) => o.textContent)
    ).toEqual(["Not assigned yet", "Dr. Sana Iqbal"]);
    expect(Array.from(nurseSelect.options).map((o) => o.textContent)).toEqual([
      "Not assigned yet",
      "Nurse Bilal",
    ]);
  });

  it("tells the hospital to add staff first when none exist yet", () => {
    setup({ clinicians: [] });
    render(<EnrolPatientPage />);
    screen.getByText(/No clinical staff have joined yet/);
  });

  it("navigates to the new patient's page on success", async () => {
    const { mutateAsync } = setup();
    render(<EnrolPatientPage />);

    fillRequired();
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
    fireEvent.click(screen.getByLabelText("Record a pregnancy now"));
    fireEvent.click(screen.getByRole("button", { name: /Enrol patient/ }));

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});
