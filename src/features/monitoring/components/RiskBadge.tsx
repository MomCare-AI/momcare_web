import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  HelpCircle,
} from "lucide-react";

import {
  canonicalLevel,
  riskBadgeClass,
  riskLabel,
  type RiskLevel,
} from "../types";

// low/medium/high is the scale the model produces. Retired four-level names
// on older alert rows are folded onto it by canonicalLevel, so they get the
// same icon as the level they actually mean.
const ICONS = {
  low: CheckCircle2,
  medium: CircleAlert,
  high: AlertTriangle,
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
  // An unrecognised level must still render — a badge that throws would take
  // the whole alerts page down rather than showing one odd row.
  const canonical = canonicalLevel(level);
  const Icon = canonical ? ICONS[canonical] : HelpCircle;

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
