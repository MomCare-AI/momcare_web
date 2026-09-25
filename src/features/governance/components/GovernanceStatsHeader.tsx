"use client";

import { useState } from "react";
import { Building2, Pencil } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import { Card } from "@/shared/ui/Card";
import { EditOrganizationModal } from "./EditOrganizationModal";

function formatEstablished(value: string | null): string | null {
  if (!value) return null;
  const year = new Date(value).getFullYear();
  return Number.isFinite(year) ? `Est. ${year}` : null;
}

/**
 * The persistent header atop System Governance, above the tab strip — one
 * compact row (icon, name, established date, inline counts, status/edit),
 * matching the reference platform's own header bar rather than a taller
 * stacked card + separate KPI-tile grid.
 */
export function GovernanceStatsHeader() {
  const { org, isHospitalAdmin } = usePortal();
  const established = formatEstablished(org.established_date);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <Card style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          padding: "12px 18px",
        }}
      >
        <span className="mc-empty-icon" style={{ flexShrink: 0 }}>
          <Building2 size={17} strokeWidth={1.9} aria-hidden />
        </span>

        <div style={{ minWidth: 0 }}>
          <div className="mc-card-title" style={{ fontSize: 15 }}>
            {org.name}
          </div>
          {established && (
            <div className="mc-card-sub" style={{ fontSize: 12 }}>
              {established}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginLeft: "auto",
          }}
        >
          <InlineStat value={org.location_count} label="Locations" />
          <StatDivider />
          <InlineStat value={org.staff_count} label="Staff" />
          <StatDivider />
          <InlineStat value={org.patient_count} label="Patients" />

          {isHospitalAdmin && (
            <>
              <StatDivider />
              <span
                className={`mc-badge mc-badge-${org.status === "approved" ? "stable" : "neutral"}`}
              >
                {org.status_display}
              </span>
              <button
                type="button"
                className="mc-btn-ghost mc-btn-sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil size={13} strokeWidth={2} aria-hidden />
                Edit organization
              </button>
              <EditOrganizationModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
              />
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function StatDivider() {
  return (
    <span
      aria-hidden
      style={{
        width: 1,
        height: 26,
        background: "var(--c-border-soft)",
        flexShrink: 0,
      }}
    />
  );
}

function InlineStat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: "center", lineHeight: 1.2 }}>
      <div className="mc-kpi-value" style={{ fontSize: 18 }}>
        {value}
      </div>
      <div className="mc-kpi-label" style={{ fontSize: 10.5 }}>
        {label}
      </div>
    </div>
  );
}
