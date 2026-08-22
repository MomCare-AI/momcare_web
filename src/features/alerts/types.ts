/** Mirrors core/alerts/api/serializers.py. */

import type { RiskLevel } from "@/features/monitoring/types";

export type AlertStatus = "open" | "acknowledged" | "resolved";

export interface Alert {
  id: string;
  level: RiskLevel;
  status: AlertStatus;
  status_display: string;
  /** 1 assigned clinician · 2 clinical team · 3 hospital administrator. */
  tier: number;
  tier_label: string;
  reasons: string[];
  raised_at: string;
  /** Null once acknowledged or at the top of the ladder — there is no next rung. */
  next_escalation_at: string | null;
  last_escalated_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by_name: string;
  resolved_at: string | null;
  resolution: string;
  resolution_display: string;
  patient_id: string;
  pregnancy_id: string;
  patient_name: string;
  mrn: string;
  gestational_age: string;
  /** Empty when nobody is responsible, including a clinician who has left. */
  assigned_staff_name: string;
}

export interface AlertEvent {
  id: string;
  kind:
    | "raised"
    | "worsened"
    | "escalated"
    | "notified"
    | "acknowledged"
    | "resolved";
  kind_display: string;
  tier: number | null;
  tier_label: string;
  detail: string;
  actor_name: string;
  created_at: string;
}

export interface AlertDetail extends Alert {
  events: AlertEvent[];
}

export interface AlertPage {
  count: number;
  /** How many nobody has answered yet — what the notification badge shows. */
  unacknowledged: number;
  results: Alert[];
}

/**
 * How long until this climbs to the next rung.
 *
 * Shown so a clinician can see the deadline they are working against, rather
 * than discovering it when their supervisor is paged. Returns null when there
 * is no next rung, which must render as absent — not as "0m".
 */
export function timeToEscalation(
  at: string | null
): { text: string; imminent: boolean } | null {
  if (!at) return null;

  const minutes = Math.round((new Date(at).getTime() - Date.now()) / 60000);
  if (minutes <= 0) return { text: "escalating now", imminent: true };
  if (minutes < 60)
    return { text: `escalates in ${minutes}m`, imminent: minutes <= 5 };

  const hours = Math.floor(minutes / 60);
  return { text: `escalates in ${hours}h`, imminent: false };
}

export function raisedAgo(at: string): string {
  const minutes = Math.floor((Date.now() - new Date(at).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const RESOLUTIONS = [
  { value: "handled", label: "Handled by a clinician" },
  { value: "recovered", label: "Readings returned to range" },
  { value: "pregnancy_ended", label: "Pregnancy ended" },
];
