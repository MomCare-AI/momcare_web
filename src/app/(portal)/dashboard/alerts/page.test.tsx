/**
 * The alerts page: what did the system do, who was told, and when.
 *
 * An error here must never render as an empty list — "nothing is wrong"
 * and "we could not find out" are opposite claims to a clinician — and
 * acknowledging must stay gated to clinicians, since answering an alert is
 * a clinical act, not an administrative one.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AlertsPage from "./page";
import { usePortal } from "../layout";
import {
  useAcknowledgeAlert,
  useAlert,
  useAlerts,
  useResolveAlert,
} from "@/features/alerts/hooks/useAlerts";
import type { Alert, AlertDetail } from "@/features/alerts/types";
import type {
  CurrentUser,
  OrgSummary,
} from "@/features/portal/hooks/usePortalData";

vi.mock("../layout", () => ({ usePortal: vi.fn() }));
vi.mock("@/features/alerts/hooks/useAlerts", () => ({
  useAlerts: vi.fn(),
  useAlert: vi.fn(),
  useAcknowledgeAlert: vi.fn(),
  useResolveAlert: vi.fn(),
}));
vi.mock("motion/react", () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children, ...rest }: { children?: React.ReactNode }) => (
          <div {...rest}>{children}</div>
        ),
    }
  ),
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const mockedUsePortal = vi.mocked(usePortal);
const mockedUseAlerts = vi.mocked(useAlerts);
const mockedUseAlert = vi.mocked(useAlert);
const mockedUseAcknowledgeAlert = vi.mocked(useAcknowledgeAlert);
const mockedUseResolveAlert = vi.mocked(useResolveAlert);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function portal(overrides: { role_code?: string } = {}) {
  const role_code = overrides.role_code ?? "hospital_admin";
  mockedUsePortal.mockReturnValue({
    org: {} as OrgSummary,
    user: { role_code } as CurrentUser,
    isHospitalAdmin: role_code === "hospital_admin",
    isClinician: ["provider", "nurse", "care_manager"].includes(role_code),
    refresh: vi.fn(),
  });
}

function alert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: "a1",
    level: "high",
    status: "open",
    status_display: "Open",
    tier: 1,
    tier_label: "Assigned clinician",
    reasons: ["Elevated blood pressure"],
    raised_at: new Date().toISOString(),
    next_escalation_at: null,
    last_escalated_at: null,
    acknowledged_at: null,
    acknowledged_by_name: "",
    resolved_at: null,
    resolution: "",
    resolution_display: "",
    patient_id: "p1",
    pregnancy_id: "preg1",
    patient_name: "Ayesha Bibi",
    mrn: "MRN-1",
    gestational_age: "28w",
    assigned_staff_name: "Dr. Sana Iqbal",
    ...overrides,
  };
}

function stubMutations() {
  mockedUseAcknowledgeAlert.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  } as unknown as ReturnType<typeof useAcknowledgeAlert>);
  mockedUseResolveAlert.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  } as unknown as ReturnType<typeof useResolveAlert>);
  mockedUseAlert.mockReturnValue({
    data: { events: [] } as unknown as AlertDetail,
    isPending: false,
    isSuccess: true,
  } as unknown as ReturnType<typeof useAlert>);
}

describe("AlertsPage", () => {
  it("shows a loading state, not an empty list, while the request is in flight", () => {
    portal();
    mockedUseAlerts.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      isSuccess: false,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertsPage />);
    screen.getByText("Loading alerts…");
  });

  it("distinguishes a failed load from nothing being wrong", () => {
    portal();
    mockedUseAlerts.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      isSuccess: false,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertsPage />);
    screen.getByText("Alerts unavailable");
    expect(screen.queryByText("No live alerts")).toBeNull();
  });

  it("shows the genuine empty state only once the request actually succeeded", () => {
    portal();
    mockedUseAlerts.mockReturnValue({
      data: { results: [], unacknowledged: 0 },
      isPending: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertsPage />);
    screen.getByText("No live alerts");
  });

  it("titles the page My Alerts and scopes the copy for a clinician, not for admin", () => {
    portal({ role_code: "nurse" });
    mockedUseAlerts.mockReturnValue({
      data: { results: [], unacknowledged: 0 },
      isPending: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertsPage />);
    screen.getByText("My Alerts");
    screen.getByText(
      "None of your assigned patients currently have an open alert."
    );
  });

  it("states how many alerts are unanswered", () => {
    portal();
    mockedUseAlerts.mockReturnValue({
      data: { results: [alert()], unacknowledged: 3 },
      isPending: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertsPage />);
    screen.getByText("3 not yet answered");
  });

  it("renders a row with its severity, tier, and assigned clinician", () => {
    portal();
    mockedUseAlerts.mockReturnValue({
      data: { results: [alert()], unacknowledged: 1 },
      isPending: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertsPage />);
    screen.getByText("Ayesha Bibi");
    screen.getByText("Dr. Sana Iqbal");
    screen.getByText(/assigned clinician/);
  });

  it("calls out a patient with no responsible clinician instead of leaving it blank", () => {
    portal();
    mockedUseAlerts.mockReturnValue({
      data: {
        results: [alert({ assigned_staff_name: "" })],
        unacknowledged: 1,
      },
      isPending: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertsPage />);
    screen.getByText("No clinician");
  });

  it("hides the acknowledge control from a non-clinician, since answering is a clinical act", () => {
    portal({ role_code: "hospital_admin" });
    stubMutations();
    mockedUseAlerts.mockReturnValue({
      data: { results: [alert()], unacknowledged: 1 },
      isPending: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertsPage />);
    fireEvent.click(screen.getByText("Ayesha Bibi"));
    expect(screen.queryByText("Acknowledge")).toBeNull();
  });

  it("lets a clinician acknowledge an open alert, and calls the mutation", () => {
    portal({ role_code: "provider" });
    const mutate = vi.fn();
    mockedUseAcknowledgeAlert.mockReturnValue({
      mutate,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useAcknowledgeAlert>);
    mockedUseResolveAlert.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useResolveAlert>);
    mockedUseAlert.mockReturnValue({
      data: { events: [] } as unknown as AlertDetail,
      isPending: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof useAlert>);
    mockedUseAlerts.mockReturnValue({
      data: { results: [alert()], unacknowledged: 1 },
      isPending: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertsPage />);
    fireEvent.click(screen.getByText("Ayesha Bibi"));
    fireEvent.click(screen.getByText("Acknowledge"));
    expect(mutate).toHaveBeenCalledWith("a1");
  });

  it("does not offer to acknowledge an alert that's already been acknowledged", () => {
    portal({ role_code: "provider" });
    stubMutations();
    mockedUseAlerts.mockReturnValue({
      data: {
        results: [
          alert({ status: "acknowledged", status_display: "Acknowledged" }),
        ],
        unacknowledged: 0,
      },
      isPending: false,
      isError: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertsPage />);
    fireEvent.click(screen.getByText("Ayesha Bibi"));
    expect(screen.queryByText("Acknowledge")).toBeNull();
    screen.getByText("Resolve — recovered");
  });
});
