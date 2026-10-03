import { Building2, Check, HeartHandshake } from "lucide-react";

import type { OrgType, StatusGroup } from "../types";

const TONE: Record<StatusGroup, string> = {
  pending: "mc-badge mc-badge-medium",
  approved: "mc-badge mc-badge-stable",
  rejected: "mc-badge mc-badge-critical",
  suspended: "mc-badge mc-badge-neutral",
};

/** A status pill. An approved organization carries a tick, matching the
 *  "Verified by MomCare" wording used on its detail page. */
export function StatusBadge({
  group,
  label,
}: {
  group: StatusGroup;
  label: string;
}) {
  return (
    <span className={TONE[group]}>
      {group === "approved" && (
        <Check size={12} strokeWidth={2.5} aria-hidden />
      )}
      {label}
    </span>
  );
}

/** Hospital or NGO, as a small icon pill. */
export function TypeChip({ type }: { type: OrgType }) {
  const hospital = type === "hospital";
  const Icon = hospital ? Building2 : HeartHandshake;
  return (
    <span
      className="mc-badge mc-badge-info"
      style={
        hospital
          ? undefined
          : { color: "#0f766e", background: "#f0fdfa", borderColor: "#99f6e4" }
      }
    >
      <Icon size={12} aria-hidden />
      {hospital ? "Hospital" : "NGO"}
    </span>
  );
}
