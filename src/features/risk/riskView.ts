import { canonicalLevel } from "@/features/monitoring/types";
import type { PatientListItem } from "@/features/patients/types";

/**
 * Pure helpers behind the Risk page: which bucket a patient falls in, how
 * the list is ordered, and how it is filtered. No React here, so the rules
 * are testable on their own.
 */
export type RiskBucket = "high" | "medium" | "low" | "none";

export const BUCKETS: RiskBucket[] = ["high", "medium", "low", "none"];

export const BUCKET_LABEL: Record<RiskBucket, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  // Never assessed is not the same as low risk, so it is never merged into it.
  none: "Not assessed",
};

export function bucketOf(patient: PatientListItem): RiskBucket {
  return canonicalLevel(patient.risk_level) ?? "none";
}

const RANK: Record<RiskBucket, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

/** Highest risk first; within a level, most waiting for review first, then
 *  the most recently assessed, then by name so the order is stable. */
export function sortByRisk(patients: PatientListItem[]): PatientListItem[] {
  return [...patients].sort((a, b) => {
    const byLevel = RANK[bucketOf(a)] - RANK[bucketOf(b)];
    if (byLevel) return byLevel;
    const byPending = b.pending_risk_count - a.pending_risk_count;
    if (byPending) return byPending;
    const byRecent =
      Date.parse(b.risk_assessed_at ?? "") -
      Date.parse(a.risk_assessed_at ?? "");
    if (Number.isFinite(byRecent) && byRecent) return byRecent;
    return a.full_name.localeCompare(b.full_name);
  });
}

export function countByBucket(
  patients: PatientListItem[]
): Record<RiskBucket, number> {
  const counts: Record<RiskBucket, number> = {
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
  };
  for (const p of patients) counts[bucketOf(p)] += 1;
  return counts;
}

export function filterPatients(
  patients: PatientListItem[],
  { bucket, search }: { bucket: RiskBucket | "all"; search: string }
): PatientListItem[] {
  const q = search.trim().toLowerCase();
  return patients.filter(
    (p) =>
      (bucket === "all" || bucketOf(p) === bucket) &&
      (!q ||
        p.full_name.toLowerCase().includes(q) ||
        (p.mrn ?? "").toLowerCase().includes(q))
  );
}
