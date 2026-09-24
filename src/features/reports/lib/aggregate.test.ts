import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Alert } from "@/features/alerts/types";
import type { Device } from "@/features/monitoring/types";
import type {
  PatientListItem,
  WorklistResponse,
} from "@/features/patients/types";
import type { StaffMember } from "@/features/staff/hooks/useStaff";
import {
  aggregateAlertMetrics,
  aggregateDeviceStatus,
  aggregateEnrollmentTrend,
  aggregatePregnancyStatus,
  aggregateRiskLevels,
  aggregateStaffByRole,
  aggregateWorklistGaps,
} from "./aggregate";

function patient(overrides: Partial<PatientListItem>): PatientListItem {
  return {
    id: "p1",
    mrn: null,
    full_name: "Test Patient",
    phone: "",
    cnic: "",
    date_of_birth: null,
    pregnancy_id: null,
    gestational_age_display: null,
    pregnancy_status: null,
    risk_level: null,
    risk_assessed_at: null,
    is_active: true,
    created_at: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

describe("aggregateEnrollmentTrend", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("buckets patients by created_at month, oldest to newest", () => {
    const trend = aggregateEnrollmentTrend(
      [
        patient({ created_at: "2026-09-01T00:00:00Z" }),
        patient({ created_at: "2026-09-10T00:00:00Z" }),
        patient({ created_at: "2026-08-01T00:00:00Z" }),
      ],
      3
    );
    expect(trend.map((t) => t.month)).toEqual([
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
    expect(trend.find((t) => t.month === "2026-09")?.count).toBe(2);
    expect(trend.find((t) => t.month === "2026-08")?.count).toBe(1);
    expect(trend.find((t) => t.month === "2026-07")?.count).toBe(0);
  });

  it("returns every requested month even with no patients at all", () => {
    const trend = aggregateEnrollmentTrend([], 6);
    expect(trend).toHaveLength(6);
    expect(trend.every((t) => t.count === 0)).toBe(true);
  });
});

describe("aggregateRiskLevels", () => {
  it("counts only active pregnancies, never a delivered or miscarried one", () => {
    const dist = aggregateRiskLevels([
      patient({ pregnancy_status: "active", risk_level: "high" }),
      patient({ pregnancy_status: "active", risk_level: "low" }),
      // Her pregnancy ended — must not count toward "active" totals even
      // though her last risk_level was high.
      patient({ pregnancy_status: "delivered", risk_level: "high" }),
      patient({ pregnancy_status: null, risk_level: null }),
    ]);
    expect(dist.total).toBe(2);
    expect(dist.high).toBe(1);
    expect(dist.low).toBe(1);
  });

  it("keeps 'not assessed' separate from 'low', never folding one into the other", () => {
    const dist = aggregateRiskLevels([
      patient({ pregnancy_status: "active", risk_level: null }),
      patient({ pregnancy_status: "active", risk_level: "low" }),
    ]);
    expect(dist.not_assessed).toBe(1);
    expect(dist.low).toBe(1);
  });

  it("computes needing_attention as high + medium, matching the old server logic", () => {
    const dist = aggregateRiskLevels([
      patient({ pregnancy_status: "active", risk_level: "high" }),
      patient({ pregnancy_status: "active", risk_level: "medium" }),
      patient({ pregnancy_status: "active", risk_level: "low" }),
    ]);
    expect(dist.needing_attention).toBe(2);
  });

  it("returns all zeros, not an error, for a hospital with no active pregnancies", () => {
    const dist = aggregateRiskLevels([]);
    expect(dist).toEqual({
      high: 0,
      medium: 0,
      low: 0,
      not_assessed: 0,
      total: 0,
      needing_attention: 0,
    });
  });
});

describe("aggregatePregnancyStatus", () => {
  it("counts by status and keeps 'no pregnancy' as its own honest slice", () => {
    const slices = aggregatePregnancyStatus([
      patient({ pregnancy_status: "active" }),
      patient({ pregnancy_status: "active" }),
      patient({ pregnancy_status: "delivered" }),
      patient({ pregnancy_status: null }),
    ]);
    expect(slices.find((s) => s.key === "active")?.count).toBe(2);
    expect(slices.find((s) => s.key === "delivered")?.count).toBe(1);
    expect(slices.find((s) => s.key === "none")?.count).toBe(1);
  });

  it("never fabricates a slice with zero patients", () => {
    const slices = aggregatePregnancyStatus([
      patient({ pregnancy_status: "active" }),
    ]);
    expect(slices).toHaveLength(1);
  });
});

describe("aggregateWorklistGaps", () => {
  it("counts each reason code across every worklist patient", () => {
    const worklist: WorklistResponse = {
      count: 2,
      page: 1,
      page_size: 25,
      total_pages: 1,
      next: null,
      previous: null,
      results: [
        {
          patient_id: "1",
          pregnancy_id: "1",
          full_name: "A",
          gestational_age: "10w",
          reasons: [
            { code: "no_recent_reading", detail: "", days: 10 },
            { code: "no_lead_clinician", detail: "", days: null },
          ],
        },
        {
          patient_id: "2",
          pregnancy_id: "2",
          full_name: "B",
          gestational_age: "20w",
          reasons: [{ code: "no_recent_reading", detail: "", days: 5 }],
        },
      ],
    };
    const gaps = aggregateWorklistGaps(worklist);
    expect(gaps.find((g) => g.code === "no_recent_reading")?.count).toBe(2);
    expect(gaps.find((g) => g.code === "no_lead_clinician")?.count).toBe(1);
  });
});

function device(status: Device["status"]): Device {
  return {
    id: "d1",
    serial_number: "SN1",
    status,
    status_display: status,
    acquisition: "",
    acquisition_display: "",
    assigned_pregnancy: null,
    wearer_name: "",
    is_assigned: status === "assigned",
    assigned_at: null,
    notes: "",
  };
}

describe("aggregateDeviceStatus", () => {
  it("counts real device statuses only — never invents a status", () => {
    const slices = aggregateDeviceStatus([
      device("assigned"),
      device("assigned"),
      device("in_stock"),
    ]);
    expect(slices.find((s) => s.key === "assigned")?.count).toBe(2);
    expect(slices.find((s) => s.key === "in_stock")?.count).toBe(1);
    expect(slices.find((s) => s.key === "faulty")).toBeUndefined();
  });
});

function staffMember(role_code: string): StaffMember {
  return {
    id: "s1",
    user_id: "u1",
    employee_id: "E1",
    full_name: "Staff Person",
    email: "s@example.com",
    role_name: role_code,
    role_code,
    phone: "",
    is_user_active: true,
    has_activated: true,
    is_active: true,
    photo: null,
    qualifications: "",
    specialty: "",
    registration_number: "",
    registration_authority: "",
    practicing_since: null,
    years_of_experience: null,
    location_ids: [],
    created_at: "2026-01-01T00:00:00Z",
  };
}

describe("aggregateStaffByRole", () => {
  it("counts staff by role_code", () => {
    const slices = aggregateStaffByRole([
      staffMember("provider"),
      staffMember("nurse"),
      staffMember("nurse"),
    ]);
    expect(slices.find((s) => s.key === "provider")?.count).toBe(1);
    expect(slices.find((s) => s.key === "nurse")?.count).toBe(2);
  });
});

function alert(overrides: Partial<Alert>): Alert {
  return {
    id: "a1",
    level: "high",
    status: "open",
    status_display: "Open",
    tier: 1,
    tier_label: "Assigned clinician",
    reasons: [],
    raised_at: "2026-09-15T10:00:00Z",
    next_escalation_at: null,
    last_escalated_at: null,
    acknowledged_at: null,
    acknowledged_by_name: "",
    resolved_at: null,
    resolution: "",
    resolution_display: "",
    patient_id: "p1",
    pregnancy_id: "pr1",
    patient_name: "Test",
    mrn: "",
    gestational_age: "20w",
    assigned_staff_name: "",
    ...overrides,
  };
}

describe("aggregateAlertMetrics", () => {
  it("averages acknowledge/resolve time only over alerts that actually reached that point", () => {
    const live = [
      alert({
        raised_at: "2026-09-15T10:00:00Z",
        acknowledged_at: "2026-09-15T10:10:00Z",
        tier: 1,
      }),
      alert({
        raised_at: "2026-09-15T10:00:00Z",
        acknowledged_at: null,
        tier: 2,
      }),
    ];
    const resolved = [
      alert({
        raised_at: "2026-09-14T10:00:00Z",
        acknowledged_at: "2026-09-14T10:05:00Z",
        resolved_at: "2026-09-14T11:00:00Z",
        resolution: "recovered",
      }),
    ];

    const metrics = aggregateAlertMetrics(live, resolved, 1);

    expect(metrics.liveCount).toBe(2);
    expect(metrics.unacknowledged).toBe(1);
    expect(metrics.resolvedCount).toBe(1);
    // Two data points reached acknowledged: 10m and 5m -> average 7.5 -> rounds to 8.
    expect(metrics.avgMinutesToAcknowledge).toBe(8);
    expect(metrics.avgMinutesToResolve).toBe(60);
    expect(metrics.byTier.find((t) => t.key === "1")?.count).toBe(1);
    expect(metrics.byResolution.find((r) => r.key === "recovered")?.count).toBe(
      1
    );
  });

  it("returns null averages rather than 0 when nothing has been acknowledged/resolved yet", () => {
    const metrics = aggregateAlertMetrics(
      [alert({ acknowledged_at: null })],
      [],
      1
    );
    expect(metrics.avgMinutesToAcknowledge).toBeNull();
    expect(metrics.avgMinutesToResolve).toBeNull();
  });
});
