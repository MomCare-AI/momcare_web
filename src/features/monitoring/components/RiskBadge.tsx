import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  HelpCircle,
  Siren,
} from "lucide-react";

import { riskBadgeClass, riskLabel, type RiskLevel } from "../types";

const ICONS = {
  stable: CheckCircle2,
  moderate: CircleAlert,
  high: AlertTriangle,
  critical: Siren,
} as const;

interface Props {
  level: RiskLevel | null;
  /** Marks an assessment no clinician has looked at yet. */
  unacknowledged?: boolean;
}

/**
 * A patient's clinical state, as a badge.
 *
 * Never colour alone: every level carries its word too, so the badge survives
 * a colour-blind reader and a black-and-white printout — and so "Not assessed"
 * cannot be mistaken for "Stable", which is the one confusion that would let a
 * screen imply safety it has no measurement to support.
 */
export function RiskBadge({ level, unacknowledged = false }: Props) {
  const Icon = level ? ICONS[level] : HelpCircle;

  return (
    <span
      className={riskBadgeClass(level)}
      title={level ? undefined : "No vitals recorded yet"}
    >
      <Icon size={12} strokeWidth={2.3} aria-hidden />
      {riskLabel(level)}
      {unacknowledged && (
        <span className="mc-badge-dot" aria-label="Not yet reviewed" />
      )}
    </span>
  );
}
