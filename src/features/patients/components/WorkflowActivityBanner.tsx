"use client";

import { Eye, ListChecks, Timer, UserCheck, Users, Bell } from "lucide-react";
import type { DashboardKpis } from "../types";

type ListTab = "patients" | "worklist" | "requests";

interface WorkflowTile {
  id: ListTab;
  label: string;
  value: number;
  icon: React.ReactNode;
}

interface Props {
  activeTab: ListTab;
  onSelect: (tab: ListTab) => void;
  patientsCount: number;
  worklistCount: number;
  requestsCount: number;
  /** From GET /api/patients/dashboard-kpis/ — undefined while loading or on
   *  error, in which case the tiles show "—" rather than a fabricated 0. */
  careActivities?: DashboardKpis["care_activities"];
}

/**
 * Restyled from the reference platform's own "Workflow" + "Care Activity"
 * tile rows. Workflow is real data — the exact same Patients/Worklist/Join
 * Requests counts Phase 5 already built as a plain tab strip, just given
 * the reference's tinted-banner, clickable-tile look here instead.
 * Care Activity is now real data too, backed by
 * GET /api/patients/dashboard-kpis/'s `care_activities` (monitoring
 * follow-up, unseen readings, reading reminder) — this replaced the
 * "Coming soon" placeholder tiles that shipped before that endpoint
 * existed. "Out of Range Readings" was renamed to "Reading Reminder" to
 * match what the endpoint actually reports — MomCare has no aggregate for
 * out-of-range vitals hospital-wide, and labelling a reminder-to-record
 * count as "out of range" would misrepresent it.
 */
export function WorkflowActivityBanner({
  activeTab,
  onSelect,
  patientsCount,
  worklistCount,
  requestsCount,
  careActivities,
}: Props) {
  const workflowTiles: WorkflowTile[] = [
    {
      id: "patients",
      label: "All Patients",
      value: patientsCount,
      icon: <Users size={16} strokeWidth={1.9} aria-hidden />,
    },
    {
      id: "worklist",
      label: "Worklist",
      value: worklistCount,
      icon: <ListChecks size={16} strokeWidth={1.9} aria-hidden />,
    },
    {
      id: "requests",
      label: "Join Requests",
      value: requestsCount,
      icon: <UserCheck size={16} strokeWidth={1.9} aria-hidden />,
    },
  ];

  const careActivityTiles: {
    label: string;
    value?: number;
    icon: React.ReactNode;
  }[] = [
    {
      label: "Monitoring Follow-up",
      value: careActivities?.monitoring_follow_up,
      icon: <Timer size={16} strokeWidth={1.9} aria-hidden />,
    },
    {
      label: "Unseen Readings",
      value: careActivities?.unseen_readings,
      icon: <Eye size={16} strokeWidth={1.9} aria-hidden />,
    },
    {
      label: "Reading Reminder",
      value: careActivities?.reading_reminder,
      icon: <Bell size={16} strokeWidth={1.9} aria-hidden />,
    },
  ];

  return (
    <div className="mc-hero" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--c-teal)",
              marginBottom: 10,
            }}
          >
            Workflow
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {workflowTiles.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => onSelect(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--c-card)",
                  border: `1px solid ${activeTab === t.id ? "var(--c-teal)" : "var(--c-border-soft)"}`,
                  borderRadius: "var(--r-control)",
                  padding: "9px 14px",
                  minWidth: 120,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span className="mc-kpi-icon mc-kpi-icon-brand">{t.icon}</span>
                <span>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: "var(--c-ink)",
                      lineHeight: 1,
                    }}
                  >
                    {t.value}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--c-faint)",
                      marginTop: 3,
                    }}
                  >
                    {t.label}
                  </div>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--c-faint)",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Care Activity
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {careActivityTiles.map((t) => (
              <div
                key={t.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--c-card)",
                  border: "1px solid var(--c-border-soft)",
                  borderRadius: "var(--r-control)",
                  padding: "9px 14px",
                  minWidth: 120,
                }}
              >
                <span className="mc-kpi-icon">{t.icon}</span>
                <span>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color:
                        t.value === undefined
                          ? "var(--c-faint)"
                          : "var(--c-ink)",
                      lineHeight: 1,
                    }}
                  >
                    {t.value ?? "—"}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--c-faint)",
                      marginTop: 3,
                    }}
                  >
                    {t.label}
                  </div>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
