"use client";

import { useState } from "react";
import { Building2, MapPin, Pencil, Stethoscope, Users } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import { Card, CardBody } from "@/shared/ui/Card";
import { EditOrganizationModal } from "./EditOrganizationModal";

function formatEstablished(value: string | null): string | null {
  if (!value) return null;
  const year = new Date(value).getFullYear();
  return Number.isFinite(year) ? `Est. ${year}` : null;
}

/**
 * The persistent card atop System Governance, above the tab strip — org
 * identity plus the same three counts every tab's own data ultimately rolls
 * up to. All three (location_count/staff_count/patient_count) are already on
 * OrgSummary via usePortal(); this makes no API call of its own.
 *
 * Editing the hospital's own record happens from here (an "Edit organization"
 * icon, matching the reference platform's own header-card pattern) rather
 * than a dedicated governance tab — there never was a "Hospital" tab in the
 * layout MomCare is matching, only this card with an inline edit affordance.
 */
export function GovernanceStatsHeader() {
  const { org, isHospitalAdmin } = usePortal();
  const established = formatEstablished(org.established_date);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <Card style={{ marginBottom: 18 }}>
      <CardBody>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span className="mc-empty-icon" style={{ flexShrink: 0 }}>
            <Building2 size={18} strokeWidth={1.9} aria-hidden />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mc-card-title">{org.name}</div>
            {established && <div className="mc-card-sub">{established}</div>}
          </div>
          {isHospitalAdmin && (
            <>
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 16,
          }}
        >
          <StatTile
            icon={<MapPin size={16} strokeWidth={1.9} aria-hidden />}
            label="Locations"
            value={org.location_count}
          />
          <StatTile
            icon={<Stethoscope size={16} strokeWidth={1.9} aria-hidden />}
            label="Staff"
            value={org.staff_count}
          />
          <StatTile
            icon={<Users size={16} strokeWidth={1.9} aria-hidden />}
            label="Patients"
            value={org.patient_count}
          />
        </div>
      </CardBody>
    </Card>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span className="mc-kpi-icon mc-kpi-icon-brand">{icon}</span>
      <div>
        <div className="mc-kpi-value" style={{ fontSize: 22 }}>
          {value}
        </div>
        <div className="mc-kpi-label">{label}</div>
      </div>
    </div>
  );
}
