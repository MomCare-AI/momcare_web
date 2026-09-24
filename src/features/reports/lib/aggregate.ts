/**
 * Pure aggregation functions — every chart/KPI on the Reports page is one of
 * these run over data an existing endpoint already returns in bulk. No
 * network calls here, no framework: fixture arrays in, computed shapes out,
 * which is what makes these trivially testable (see aggregate.test.ts).
 */

import type { Device } from "@/features/monitoring/types";
import type {
  PatientListItem,
  WorklistResponse,
} from "@/features/patients/types";
import type { StaffMember } from "@/features/staff/hooks/useStaff";
import type { Alert } from "@/features/alerts/types";
import type {
  AlertMetrics,
  DistributionSlice,
  EnrollmentTrendPoint,
  RiskDistribution,
  WorklistGap,
} from "../types";

// Matches portal.css's own --c-* tokens, hardcoded for the same reason
// VitalsChart.tsx hardcodes its palette: these values are handed to inline
// styles / SVG props, which don't resolve CSS custom properties.
const TEAL = "#4662e8";
const STABLE = "#2f8a72";
const MODERATE = "#c98a2e";
const HIGH = "#d65f58";
const CRITICAL = "#b94343";
const INFO = "#3978b8";
const NEUTRAL = "#8a9aa3";

export function aggregateEnrollmentTrend(
  patients: PatientListItem[],
  months = 6
): EnrollmentTrendPoint[] {
  const now = new Date();
  const buckets = new Map<string, EnrollmentTrendPoint>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, {
      month: key,
      label: d.toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      }),
      count: 0,
    });
  }
  for (const p of patients) {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.count += 1;
  }
  return Array.from(buckets.values());
}

const PREGNANCY_STATUS_META: Record<string, { label: string; color: string }> =
  {
    active: { label: "Active", color: STABLE },
    delivered: { label: "Delivered", color: INFO },
    miscarriage: { label: "Miscarriage", color: NEUTRAL },
    termination: { label: "Termination", color: NEUTRAL },
    stillbirth: { label: "Stillbirth", color: NEUTRAL },
    ended_other: { label: "Ended — other", color: NEUTRAL },
  };

export function aggregatePregnancyStatus(
  patients: PatientListItem[]
): DistributionSlice[] {
  const counts = new Map<string, number>();
  let none = 0;
  for (const p of patients) {
    if (!p.pregnancy_status) {
      none += 1;
      continue;
    }
    counts.set(p.pregnancy_status, (counts.get(p.pregnancy_status) ?? 0) + 1);
  }
  const slices: DistributionSlice[] = Array.from(counts.entries()).map(
    ([key, count]) => ({
      key,
      label: PREGNANCY_STATUS_META[key]?.label ?? key,
      count,
      color: PREGNANCY_STATUS_META[key]?.color ?? NEUTRAL,
    })
  );
  if (none > 0) {
    slices.push({
      key: "none",
      label: "No pregnancy recorded",
      count: none,
      color: NEUTRAL,
    });
  }
  return slices;
}

/**
 * The Overview page's risk donut, computed client-side now that
 * `/api/dashboard/summary/` is gone — same shape and same computation
 * (`needing_attention` = high + medium) the old endpoint used. Scoped to
 * *active* pregnancies only, matching the old endpoint's own framing
 * ("active pregnancies by current risk level") — a patient who delivered
 * or miscarried isn't "active" any more, and counting her risk level here
 * would overstate how many pregnancies actually need eyes on them today.
 */
export function aggregateRiskLevels(
  patients: PatientListItem[]
): RiskDistribution {
  const active = patients.filter((p) => p.pregnancy_status === "active");
  const counts = { high: 0, medium: 0, low: 0, not_assessed: 0 };
  for (const p of active) {
    const key = p.risk_level ?? "not_assessed";
    if (key in counts) counts[key as keyof typeof counts] += 1;
  }
  return {
    ...counts,
    total: active.length,
    needing_attention: counts.high + counts.medium,
  };
}

const WORKLIST_REASON_LABELS: Record<string, string> = {
  no_recent_reading: "No recent reading",
  no_recent_note: "No recent note",
  no_risk_history: "No risk history answered",
  no_lead_clinician: "No lead clinician",
};

export function aggregateWorklistGaps(
  worklist: WorklistResponse
): WorklistGap[] {
  const counts = new Map<string, number>();
  for (const patient of worklist.results) {
    for (const reason of patient.reasons) {
      counts.set(reason.code, (counts.get(reason.code) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries()).map(([code, count]) => ({
    code,
    label: WORKLIST_REASON_LABELS[code] ?? code,
    count,
  }));
}

const DEVICE_STATUS_META: Record<string, { label: string; color: string }> = {
  in_stock: { label: "In stock", color: NEUTRAL },
  assigned: { label: "Assigned", color: STABLE },
  returned: { label: "Returned", color: INFO },
  faulty: { label: "Faulty", color: HIGH },
  lost: { label: "Lost", color: CRITICAL },
};

export function aggregateDeviceStatus(devices: Device[]): DistributionSlice[] {
  const counts = new Map<string, number>();
  for (const d of devices)
    counts.set(d.status, (counts.get(d.status) ?? 0) + 1);
  return Array.from(counts.entries()).map(([key, count]) => ({
    key,
    label: DEVICE_STATUS_META[key]?.label ?? key,
    count,
    color: DEVICE_STATUS_META[key]?.color ?? NEUTRAL,
  }));
}

const ROLE_META: Record<string, { label: string; color: string }> = {
  hospital_admin: { label: "Hospital admin", color: TEAL },
  provider: { label: "Doctor / Provider", color: STABLE },
  nurse: { label: "Nurse", color: INFO },
  care_manager: { label: "Care manager", color: MODERATE },
};

export function aggregateStaffByRole(
  staff: StaffMember[]
): DistributionSlice[] {
  const counts = new Map<string, number>();
  for (const m of staff)
    counts.set(m.role_code, (counts.get(m.role_code) ?? 0) + 1);
  return Array.from(counts.entries()).map(([key, count]) => ({
    key,
    label: ROLE_META[key]?.label ?? key,
    count,
    color: ROLE_META[key]?.color ?? NEUTRAL,
  }));
}

const TIER_META: Record<number, { label: string; color: string }> = {
  1: { label: "Assigned clinician", color: MODERATE },
  2: { label: "Clinical team", color: HIGH },
  3: { label: "Hospital administrator", color: CRITICAL },
};

const RESOLUTION_META: Record<string, { label: string; color: string }> = {
  recovered: { label: "Readings returned to range", color: STABLE },
  handled: { label: "Handled by a clinician", color: INFO },
  pregnancy_ended: { label: "Pregnancy ended", color: NEUTRAL },
};

/** Minutes between two timestamps, averaged — null (never 0) when nothing
 *  in the set has actually reached the second timestamp yet. */
function avgMinutesBetween(
  pairs: Array<[string, string | null]>
): number | null {
  const deltas = pairs
    .filter((pair): pair is [string, string] => pair[1] !== null)
    .map(
      ([start, end]) =>
        (new Date(end).getTime() - new Date(start).getTime()) / 60000
    );
  if (deltas.length === 0) return null;
  return Math.round(deltas.reduce((sum, m) => sum + m, 0) / deltas.length);
}

export function aggregateAlertMetrics(
  liveAlerts: Alert[],
  resolvedAlerts: Alert[],
  unacknowledged: number
): AlertMetrics {
  const tierCounts = new Map<number, number>();
  for (const a of liveAlerts)
    tierCounts.set(a.tier, (tierCounts.get(a.tier) ?? 0) + 1);
  const byTier: DistributionSlice[] = Array.from(tierCounts.entries()).map(
    ([tier, count]) => ({
      key: String(tier),
      label: TIER_META[tier]?.label ?? `Tier ${tier}`,
      count,
      color: TIER_META[tier]?.color ?? NEUTRAL,
    })
  );

  const resolutionCounts = new Map<string, number>();
  for (const a of resolvedAlerts) {
    if (!a.resolution) continue;
    resolutionCounts.set(
      a.resolution,
      (resolutionCounts.get(a.resolution) ?? 0) + 1
    );
  }
  const byResolution: DistributionSlice[] = Array.from(
    resolutionCounts.entries()
  ).map(([key, count]) => ({
    key,
    label: RESOLUTION_META[key]?.label ?? key,
    count,
    color: RESOLUTION_META[key]?.color ?? NEUTRAL,
  }));

  return {
    liveCount: liveAlerts.length,
    unacknowledged,
    resolvedCount: resolvedAlerts.length,
    avgMinutesToAcknowledge: avgMinutesBetween(
      [...liveAlerts, ...resolvedAlerts].map((a) => [
        a.raised_at,
        a.acknowledged_at,
      ])
    ),
    avgMinutesToResolve: avgMinutesBetween(
      resolvedAlerts.map((a) => [a.raised_at, a.resolved_at])
    ),
    byTier,
    byResolution,
  };
}
