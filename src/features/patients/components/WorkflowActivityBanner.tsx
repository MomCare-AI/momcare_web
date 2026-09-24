"use client";

import {
  AlertTriangle,
  Eye,
  FileClock,
  ListChecks,
  Timer,
  UserCheck,
  Users,
} from "lucide-react";

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
}

/**
 * Restyled from the reference platform's own "Workflow" + "Care Activity"
 * tile rows. Workflow is real data — the exact same Patients/Worklist/Join
 * Requests counts Phase 5 already built as a plain tab strip, just given
 * the reference's tinted-banner, clickable-tile look here instead. Care
 * Activity has no MomCare aggregate anywhere, hospital-wide — not even
 * partial data — so those three tiles are deliberately inert placeholders,
 * per direct discussion with the user, same shell precedent as the Devices/
 * Documents/AI Summary placeholders already built this session.
 */
export function WorkflowActivityBanner({
  activeTab,
  onSelect,
  patientsCount,
  worklistCount,
  requestsCount,
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

  const careActivityTiles = [
    {
      label: "Out of Range Readings",
      icon: <AlertTriangle size={16} strokeWidth={1.9} aria-hidden />,
    },
    {
      label: "Monitoring Follow-up",
      icon: <Timer size={16} strokeWidth={1.9} aria-hidden />,
    },
    {
      label: "Unseen Readings",
      icon: <Eye size={16} strokeWidth={1.9} aria-hidden />,
    },
  ];

  return (
    <div className="mc-hero" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px" }}>
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
                  minWidth: 150,
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

        <div style={{ flex: "1 1 320px" }}>
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
            <span
              className="mc-badge mc-badge-neutral"
              style={{ fontSize: 10 }}
            >
              <FileClock size={10} strokeWidth={2.2} aria-hidden />
              Coming soon
            </span>
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
                  border: "1px dashed var(--c-border-soft)",
                  borderRadius: "var(--r-control)",
                  padding: "9px 14px",
                  minWidth: 150,
                  opacity: 0.7,
                }}
              >
                <span
                  className="mc-kpi-icon"
                  style={{ color: "var(--c-faint)" }}
                >
                  {t.icon}
                </span>
                <span>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: "var(--c-faint)",
                      lineHeight: 1,
                    }}
                  >
                    —
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
