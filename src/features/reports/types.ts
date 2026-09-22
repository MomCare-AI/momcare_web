/**
 * Shapes for the Reports section — all derived client-side from data the
 * existing endpoints already return in bulk (patients, staff, devices,
 * alerts). Nothing here is fetched from a dedicated reports endpoint,
 * because none exists — see docs/conventions.md's rule against inventing a
 * backend contract from the frontend side.
 */

import type { DonutSlice } from "@/shared/charts/StatusDonut";

/** The generic label/count/color shape a donut needs — defined in
 *  shared/charts/StatusDonut (zero MomCare awareness) and reused here
 *  rather than redefined, keeping the core/features/shared dependency
 *  direction one-way. */
export type DistributionSlice = DonutSlice;

export interface EnrollmentTrendPoint {
  /** "2026-04" — sorts and groups correctly without a date library. */
  month: string;
  /** "Apr 2026" — what's actually shown on the axis. */
  label: string;
  count: number;
}

export interface WorklistGap {
  code: string;
  label: string;
  count: number;
}

export interface AlertMetrics {
  liveCount: number;
  unacknowledged: number;
  resolvedCount: number;
  /** Minutes. Null when there's nothing resolved/acknowledged yet to average —
   *  an absent number, never a fabricated zero. */
  avgMinutesToAcknowledge: number | null;
  avgMinutesToResolve: number | null;
  byTier: DistributionSlice[];
  byResolution: DistributionSlice[];
}
