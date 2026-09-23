"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  Stethoscope,
  UserPlus,
  Users,
  UserX,
  Wifi,
} from "lucide-react";

import { useAlerts } from "@/features/alerts/hooks/useAlerts";
import { useDevices } from "@/features/monitoring/hooks/useMonitoring";
import { useWorklist } from "@/features/patients/hooks/usePatients";
import { useInvites, useStaffList } from "@/features/staff/hooks/useStaff";
import { StatusDonut } from "@/shared/charts/StatusDonut";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
import { RecentAlertsList } from "@/features/reports/components/AlertMetricsPanel";
import { CareTeamRoster } from "@/features/reports/components/CareTeamRoster";
import { EnrollmentTrendChart } from "@/features/reports/components/EnrollmentTrendChart";
import { useAllPatients } from "@/features/reports/hooks/useReports";
import {
  aggregateAlertMetrics,
  aggregateDeviceStatus,
  aggregateEnrollmentTrend,
  aggregatePregnancyStatus,
  aggregateStaffByRole,
  aggregateWorklistGaps,
} from "@/features/reports/lib/aggregate";
import { downloadCsv, toCsv, type CsvColumn } from "@/shared/lib/exportCsv";
import { usePortal } from "../layout";
import { usePageTitle } from "@/hooks/usePageTitle";

/** Today's date as YYYYMMDD, for a filename that sorts and doesn't collide. */
function exportDateStamp(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function ExportButton<T>({
  rows,
  columns,
  filename,
}: {
  rows: T[];
  columns: CsvColumn<T>[];
  filename: string;
}) {
  return (
    <button
      type="button"
      className="mc-btn-ghost"
      disabled={rows.length === 0}
      onClick={() =>
        downloadCsv(
          `${filename}-${exportDateStamp()}.csv`,
          toCsv(rows, columns)
        )
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        marginLeft: "auto",
      }}
    >
      <Download size={15} strokeWidth={1.9} aria-hidden />
      Export CSV
    </button>
  );
}

type Tab = "clinical" | "care-team" | "alerts";

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
}

export default function ReportsPage() {
  usePageTitle("Executive Dashboard");
  const { isHospitalAdmin } = usePortal();
  const [tab, setTab] = useState<Tab>("clinical");

  return (
    <>
      <div className="mc-head">
        <div>
          <h1 className="mc-h1">Executive Dashboard</h1>
          <p className="mc-sub">Hospital-wide operational overview</p>
        </div>
      </div>

      <div className="mc-tabs" role="tablist" aria-label="Report section">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "clinical"}
          aria-current={tab === "clinical" ? "page" : undefined}
          className="mc-tab"
          onClick={() => setTab("clinical")}
        >
          Clinical Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "care-team"}
          aria-current={tab === "care-team" ? "page" : undefined}
          className="mc-tab"
          onClick={() => setTab("care-team")}
        >
          Care Team
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "alerts"}
          aria-current={tab === "alerts" ? "page" : undefined}
          className="mc-tab"
          onClick={() => setTab("alerts")}
        >
          Alerts &amp; Escalation
        </button>
      </div>

      {tab === "clinical" && <ClinicalOverviewTab />}
      {tab === "care-team" && <CareTeamTab isHospitalAdmin={isHospitalAdmin} />}
      {tab === "alerts" && <AlertsTab />}
    </>
  );
}

function ClinicalOverviewTab() {
  const patientsQuery = useAllPatients();
  const worklistQuery = useWorklist(false);
  const devicesQuery = useDevices();

  const patients = patientsQuery.data ?? [];
  const now = new Date();
  const newThisMonth = patients.filter((p) => {
    const d = new Date(p.created_at);
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  }).length;
  const active = patients.filter((p) => p.is_active).length;
  const inactive = patients.length - active;
  const devices = devicesQuery.data ?? [];
  const connectedDevices = devices.filter((d) => d.is_assigned).length;

  const trend = useMemo(() => aggregateEnrollmentTrend(patients), [patients]);
  const statusSlices = useMemo(
    () => aggregatePregnancyStatus(patients),
    [patients]
  );
  const worklistGaps = useMemo(
    () => (worklistQuery.data ? aggregateWorklistGaps(worklistQuery.data) : []),
    [worklistQuery.data]
  );
  const deviceSlices = useMemo(
    () => aggregateDeviceStatus(devicesQuery.data ?? []),
    [devicesQuery.data]
  );

  if (patientsQuery.isPending) {
    return (
      <Card>
        <div className="mc-rows">
          <RowSkeleton count={4} variant="plain" />
        </div>
      </Card>
    );
  }

  if (patientsQuery.isError) {
    return (
      <Card>
        <EmptyState
          icon={<Users size={20} strokeWidth={1.9} aria-hidden />}
          title="Couldn't load patients"
          text="This is a problem reaching the server, not an empty hospital."
          actions={
            <button className="mc-btn" onClick={() => patientsQuery.refetch()}>
              Try again
            </button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <div style={{ display: "flex", marginBottom: 14 }}>
        <ExportButton
          rows={patients}
          filename="clinical-overview"
          columns={[
            { header: "MRN", value: (p) => p.mrn ?? "" },
            { header: "Full name", value: (p) => p.full_name },
            { header: "Enrolled", value: (p) => p.created_at },
            { header: "Active", value: (p) => (p.is_active ? "yes" : "no") },
            {
              header: "Pregnancy status",
              value: (p) => p.pregnancy_status ?? "",
            },
            { header: "Risk level", value: (p) => p.risk_level ?? "" },
          ]}
        />
      </div>
      <section className="mc-kpis">
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Total enrolled</span>
            <span className="mc-kpi-icon mc-kpi-icon-brand">
              <Users size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{patients.length}</span>
          <span className="mc-kpi-foot">At this hospital</span>
        </div>
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Active</span>
            <span className="mc-kpi-icon mc-kpi-icon-stable">
              <Users size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{active}</span>
          <span className="mc-kpi-foot">At this hospital</span>
        </div>
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Inactive</span>
            <span className="mc-kpi-icon mc-kpi-icon-neutral">
              <UserX size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{inactive}</span>
          <span className="mc-kpi-foot">No longer under care</span>
        </div>
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">New this month</span>
            <span className="mc-kpi-icon mc-kpi-icon-info">
              <UserPlus size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{newThisMonth}</span>
          <span className="mc-kpi-foot">Enrolled since the 1st</span>
        </div>
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Connected devices</span>
            <span className="mc-kpi-icon mc-kpi-icon-stable">
              <Wifi size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{connectedDevices}</span>
          <span className="mc-kpi-foot">
            of {devices.length} device{devices.length === 1 ? "" : "s"} total
          </span>
        </div>
      </section>

      <div className="mc-fullstack">
        <Card>
          <CardHeader>
            <div className="mc-card-title">Enrollment trend</div>
            <div className="mc-card-sub">Last 6 months</div>
          </CardHeader>
          <CardBody>
            {patients.length === 0 ? (
              <p className="mc-hint">No patients enrolled yet.</p>
            ) : (
              <EnrollmentTrendChart data={trend} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="mc-card-title">Pregnancy status</div>
            <div className="mc-card-sub">
              Every enrolled patient, by outcome
            </div>
          </CardHeader>
          <CardBody>
            <StatusDonut
              slices={statusSlices}
              centerLabel="patients"
              emptyText="No patients enrolled yet."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="mc-card-title">Worklist gaps</div>
            <div className="mc-card-sub">
              Administrative/care-continuity gaps, not clinical severity
            </div>
          </CardHeader>
          <CardBody>
            {worklistQuery.isPending ? (
              <p className="mc-hint">Loading…</p>
            ) : worklistGaps.length === 0 ? (
              <p className="mc-hint">No open gaps right now.</p>
            ) : (
              <div className="mc-riskbars">
                {worklistGaps.map((g) => (
                  <div key={g.code} className="mc-riskbar-row">
                    <span className="mc-riskbar-tag">{g.label}</span>
                    <span className="mc-riskbar-count">{g.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="mc-card-title">Device distribution</div>
            <div className="mc-card-sub">Every device this hospital owns</div>
          </CardHeader>
          <CardBody>
            <StatusDonut
              slices={deviceSlices}
              centerLabel="devices"
              emptyText="No devices registered yet."
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function CareTeamTab({ isHospitalAdmin }: { isHospitalAdmin: boolean }) {
  const staffQuery = useStaffList();
  const invitesQuery = useInvites(isHospitalAdmin);

  const staff = staffQuery.data ?? [];
  const invites = invitesQuery.data ?? [];
  const activeStaff = staff.filter(
    (m) => m.is_active && m.is_user_active
  ).length;
  const pendingInvites = invites.filter((i) => i.status === "pending").length;

  const roleSlices = useMemo(() => aggregateStaffByRole(staff), [staff]);

  if (staffQuery.isPending) {
    return (
      <Card>
        <div className="mc-rows">
          <RowSkeleton count={4} variant="plain" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <div style={{ display: "flex", marginBottom: 14 }}>
        <ExportButton
          rows={staff}
          filename="care-team"
          columns={[
            { header: "Employee ID", value: (m) => m.employee_id },
            { header: "Full name", value: (m) => m.full_name },
            { header: "Role", value: (m) => m.role_name },
            { header: "Specialty", value: (m) => m.specialty },
            {
              header: "Years of experience",
              value: (m) => m.years_of_experience ?? "",
            },
            {
              header: "Active",
              value: (m) => (m.is_active && m.is_user_active ? "yes" : "no"),
            },
          ]}
        />
      </div>
      <section className="mc-kpis">
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Total staff</span>
            <span className="mc-kpi-icon mc-kpi-icon-brand">
              <Stethoscope size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{staff.length}</span>
          <span className="mc-kpi-foot">On the clinical team</span>
        </div>
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Active</span>
            <span className="mc-kpi-icon mc-kpi-icon-stable">
              <Stethoscope size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{activeStaff}</span>
          <span className="mc-kpi-foot">
            {staff.length - activeStaff} inactive
          </span>
        </div>
        {isHospitalAdmin && (
          <div className="mc-kpi">
            <div className="mc-kpi-top">
              <span className="mc-kpi-label">Pending invites</span>
              <span className="mc-kpi-icon mc-kpi-icon-info">
                <Mail size={17} strokeWidth={1.9} aria-hidden />
              </span>
            </div>
            <span className="mc-kpi-value">{pendingInvites}</span>
            <span className="mc-kpi-foot">Awaiting acceptance</span>
          </div>
        )}
      </section>

      <div className="mc-fullstack">
        <Card>
          <CardHeader>
            <div className="mc-card-title">Staff by role</div>
          </CardHeader>
          <CardBody>
            <StatusDonut
              slices={roleSlices}
              centerLabel="staff"
              emptyText="No staff added yet."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="mc-card-title">Roster</div>
            <div className="mc-card-sub">
              Per-staff patient counts aren&rsquo;t shown — the care team
              relationship has no hospital-wide endpoint yet, only
              per-pregnancy.
            </div>
          </CardHeader>
          {staff.length === 0 ? (
            <EmptyState
              icon={<Stethoscope size={20} strokeWidth={1.9} aria-hidden />}
              title="No staff yet"
              text="Invite doctors, nurses and care managers from System Governance."
            />
          ) : (
            <CareTeamRoster staff={staff} />
          )}
        </Card>
      </div>
    </>
  );
}

function AlertsTab() {
  const liveQuery = useAlerts("live", false);
  const resolvedQuery = useAlerts("resolved", false);

  const live = liveQuery.data?.results ?? [];
  const resolved = resolvedQuery.data?.results ?? [];
  const unacknowledged = liveQuery.data?.unacknowledged ?? 0;

  const metrics = useMemo(
    () => aggregateAlertMetrics(live, resolved, unacknowledged),
    [live, resolved, unacknowledged]
  );

  if (liveQuery.isPending) {
    return (
      <Card>
        <div className="mc-rows">
          <RowSkeleton count={4} variant="plain" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <div style={{ display: "flex", marginBottom: 14 }}>
        <ExportButton
          rows={live}
          filename="live-alerts"
          columns={[
            { header: "Patient", value: (a) => a.patient_name },
            { header: "MRN", value: (a) => a.mrn },
            { header: "Level", value: (a) => a.level },
            { header: "Tier", value: (a) => a.tier_label },
            { header: "Status", value: (a) => a.status_display },
            { header: "Raised", value: (a) => a.raised_at },
            { header: "Acknowledged", value: (a) => a.acknowledged_at },
            {
              header: "Assigned staff",
              value: (a) => a.assigned_staff_name,
            },
          ]}
        />
      </div>
      <section className="mc-kpis">
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Live alerts</span>
            <span className="mc-kpi-icon mc-kpi-icon-brand">
              <BellRing size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{metrics.liveCount}</span>
          <span className="mc-kpi-foot">Open or acknowledged right now</span>
        </div>
        <div
          className={`mc-kpi ${metrics.unacknowledged ? "mc-kpi-fill-alert" : ""}`}
        >
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Unacknowledged</span>
            <span className="mc-kpi-icon mc-kpi-icon-attn mc-kpi-icon-alert">
              <AlertTriangle size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{metrics.unacknowledged}</span>
          <span className="mc-kpi-foot">Nobody has answered yet</span>
        </div>
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Avg. time to acknowledge</span>
            <span className="mc-kpi-icon mc-kpi-icon-info">
              <Clock size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">
            {formatMinutes(metrics.avgMinutesToAcknowledge)}
          </span>
          <span className="mc-kpi-foot">Across live and resolved alerts</span>
        </div>
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Avg. time to resolve</span>
            <span className="mc-kpi-icon mc-kpi-icon-neutral">
              <CheckCircle2 size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">
            {formatMinutes(metrics.avgMinutesToResolve)}
          </span>
          <span className="mc-kpi-foot">{metrics.resolvedCount} resolved</span>
        </div>
      </section>

      <div className="mc-fullstack">
        <Card>
          <CardHeader>
            <div className="mc-card-title">Alerts by escalation tier</div>
            <div className="mc-card-sub">
              How far up the ladder live alerts have climbed
            </div>
          </CardHeader>
          <CardBody>
            <StatusDonut
              slices={metrics.byTier}
              centerLabel="live alerts"
              emptyText="No live alerts right now."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="mc-card-title">Resolution breakdown</div>
            <div className="mc-card-sub">How resolved alerts were closed</div>
          </CardHeader>
          <CardBody>
            <StatusDonut
              slices={metrics.byResolution}
              centerLabel="resolved"
              emptyText="Nothing resolved yet."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="mc-card-title">Recent live alerts</div>
          </CardHeader>
          {live.length === 0 ? (
            <EmptyState
              icon={<BellRing size={20} strokeWidth={1.9} aria-hidden />}
              title="No live alerts"
              text="Nothing needs escalation right now."
            />
          ) : (
            <RecentAlertsList alerts={live} />
          )}
        </Card>
      </div>
    </>
  );
}
