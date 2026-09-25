"use client";

import { useState } from "react";
import {
  Activity,
  AlertCircle,
  BellRing,
  CheckCircle2,
  Clock,
  PhoneOff,
  Users,
} from "lucide-react";

import { MonitoringTimeChart } from "@/features/staff-audit/components/MonitoringTimeChart";
import { useStaffAuditReport } from "@/features/staff-audit/hooks/useStaffAudit";
import type { AuditPeriodCode } from "@/features/staff-audit/types";
import { useStaffList } from "@/features/staff/hooks/useStaff";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { InitialsAvatar } from "@/shared/ui/InitialsAvatar";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
import { Select } from "@/shared/ui/Select";

function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

const PERIODS: { value: AuditPeriodCode; label: string }[] = [
  { value: "2d", label: "Last 2 days" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
  { value: "3month", label: "Last 90 days" },
  { value: "6month", label: "Last 180 days" },
  { value: "year", label: "Last 365 days" },
  { value: "2year", label: "Last 730 days" },
];

/**
 * `GET /api/staff/{staff_id}/audit-report/` — per-staff activity: caseload,
 * monitoring time (with a day-by-day distribution chart), call outcomes,
 * alerts handled. Only the fields the real response actually returns are
 * shown — no RPM/CCM split, no "compliance %", no per-day averages —
 * the design doc (2026-09-25-staff-audit-report-design.md) is explicit
 * those concepts don't exist in MomCare's single-programme model, and the
 * serializer never sends them.
 */
export default function AccountInsightsPage() {
  usePageTitle("Account Insights");

  const staffQuery = useStaffList();
  const staff = staffQuery.data ?? [];

  const [staffId, setStaffId] = useState<string | null>(null);
  const [period, setPeriod] = useState<AuditPeriodCode>("month");

  const activeStaffId = staffId ?? staff[0]?.id ?? null;
  const reportQuery = useStaffAuditReport(activeStaffId, period);
  const activeMember = staff.find((m) => m.id === activeStaffId);
  const report = reportQuery.data;

  // Real elapsed days for this report's own period.start/end — used to turn
  // the raw totals the API returns into the per-day rates below. These five
  // tiles are genuine arithmetic on real numbers (mirrors how the API's own
  // call_success_rate is already a derived ratio, not a stored column), not
  // invented data — unlike RPM/CCM patient splits or "Out of Range" time,
  // which have no MomCare concept to derive from at all (see design doc).
  const periodDays = report
    ? Math.max(
        1,
        (new Date(report.period.end).getTime() -
          new Date(report.period.start).getTime()) /
          86400000
      )
    : 1;

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <h1 className="mc-page-title" style={{ margin: 0 }}>
          Staff Audit Report
        </h1>
        <div style={{ width: 200 }}>
          <Select
            value={period}
            onChange={(v) => setPeriod(v as AuditPeriodCode)}
            options={PERIODS}
            placeholder="Period"
            aria-label="Report period"
          />
        </div>
      </div>

      {staffQuery.isPending && (
        <Card>
          <div className="mc-rows">
            <RowSkeleton count={3} variant="plain" />
          </div>
        </Card>
      )}

      {staffQuery.isSuccess && staff.length === 0 && (
        <Card>
          <EmptyState
            icon={<Users size={20} strokeWidth={1.9} aria-hidden />}
            title="No staff yet"
            text="Onboard staff under System Governance to see their audit reports here."
          />
        </Card>
      )}

      {staffQuery.isSuccess && staff.length > 0 && activeMember && (
        <>
          <Card style={{ marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
                padding: "16px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <InitialsAvatar
                  name={activeMember.full_name || activeMember.email}
                  size={44}
                />
                <div>
                  <div className="mc-card-title" style={{ fontSize: 16 }}>
                    {activeMember.full_name || activeMember.email}
                    <span
                      className="mc-card-sub"
                      style={{ fontWeight: 500, marginLeft: 8 }}
                    >
                      — {activeMember.role_name}
                    </span>
                  </div>
                  <div className="mc-card-sub">
                    {activeMember.phone || "No phone on file"}
                  </div>
                </div>
              </div>

              <div style={{ width: 260 }}>
                <Select
                  value={activeStaffId ?? ""}
                  onChange={(v) => setStaffId(v)}
                  options={staff.map((m) => ({
                    value: m.id,
                    label: `${m.full_name || m.email} — ${m.role_name}`,
                  }))}
                  placeholder="Choose a staff member"
                  aria-label="Choose a staff member"
                />
              </div>
            </div>
          </Card>

          {reportQuery.isPending && (
            <Card>
              <div className="mc-rows">
                <RowSkeleton count={3} variant="plain" />
              </div>
            </Card>
          )}

          {reportQuery.isError && (
            <Card>
              <EmptyState
                icon={<AlertCircle size={20} strokeWidth={1.9} aria-hidden />}
                title="Couldn't load this report"
                text={
                  reportQuery.error instanceof Error
                    ? reportQuery.error.message
                    : "This is a problem reaching the server."
                }
                actions={
                  <button
                    className="mc-btn"
                    onClick={() => reportQuery.refetch()}
                  >
                    Try again
                  </button>
                }
              />
            </Card>
          )}

          {report && (
            <>
              <section
                className="mc-kpis mc-kpis-4col"
                style={{ marginBottom: 14 }}
              >
                <div className="mc-kpi">
                  <div className="mc-kpi-top">
                    <span className="mc-kpi-label">Total patients</span>
                    <span className="mc-kpi-icon mc-kpi-icon-brand">
                      <Users size={17} strokeWidth={1.9} aria-hidden />
                    </span>
                  </div>
                  <span className="mc-kpi-value">{report.total_patients}</span>
                </div>
                <div className="mc-kpi">
                  <div className="mc-kpi-top">
                    <span className="mc-kpi-label">Monitoring time</span>
                    <span className="mc-kpi-icon mc-kpi-icon-info">
                      <Clock size={17} strokeWidth={1.9} aria-hidden />
                    </span>
                  </div>
                  <span className="mc-kpi-value">
                    {report.monitoring_time.total_formatted}
                  </span>
                </div>
                <div className="mc-kpi">
                  <div className="mc-kpi-top">
                    <span className="mc-kpi-label">Two-way calls</span>
                    <span className="mc-kpi-icon mc-kpi-icon-stable">
                      <Activity size={17} strokeWidth={1.9} aria-hidden />
                    </span>
                  </div>
                  <span className="mc-kpi-value">
                    {report.call_outcomes.two_way_count}
                  </span>
                </div>
                <div className="mc-kpi">
                  <div className="mc-kpi-top">
                    <span className="mc-kpi-label">Voicemails</span>
                    <span className="mc-kpi-icon mc-kpi-icon-neutral">
                      <PhoneOff size={17} strokeWidth={1.9} aria-hidden />
                    </span>
                  </div>
                  <span className="mc-kpi-value">
                    {report.call_outcomes.voicemail_count}
                  </span>
                </div>
              </section>

              <section
                className="mc-kpis mc-kpis-4col"
                style={{ marginBottom: 14 }}
              >
                <div className="mc-kpi">
                  <div className="mc-kpi-top">
                    <span className="mc-kpi-label">Call success rate</span>
                    <span className="mc-kpi-icon mc-kpi-icon-stable">
                      <CheckCircle2 size={17} strokeWidth={1.9} aria-hidden />
                    </span>
                  </div>
                  <span className="mc-kpi-value">
                    {Math.round(report.call_outcomes.call_success_rate * 100)}%
                  </span>
                </div>
                <div className="mc-kpi">
                  <div className="mc-kpi-top">
                    <span className="mc-kpi-label">Alerts acknowledged</span>
                    <span className="mc-kpi-icon mc-kpi-icon-info">
                      <BellRing size={17} strokeWidth={1.9} aria-hidden />
                    </span>
                  </div>
                  <span className="mc-kpi-value">
                    {report.alerts_handled.acknowledged_count}
                  </span>
                </div>
                <div className="mc-kpi">
                  <div className="mc-kpi-top">
                    <span className="mc-kpi-label">Alerts resolved</span>
                    <span className="mc-kpi-icon mc-kpi-icon-stable">
                      <CheckCircle2 size={17} strokeWidth={1.9} aria-hidden />
                    </span>
                  </div>
                  <span className="mc-kpi-value">
                    {report.alerts_handled.resolved_count}
                  </span>
                </div>
                <div className="mc-kpi">
                  <div className="mc-kpi-top">
                    <span className="mc-kpi-label">Avg daily monitoring</span>
                    <span className="mc-kpi-icon mc-kpi-icon-info">
                      <Clock size={17} strokeWidth={1.9} aria-hidden />
                    </span>
                  </div>
                  <span className="mc-kpi-value">
                    {formatSeconds(
                      report.monitoring_time.total_seconds / periodDays
                    )}
                  </span>
                </div>
              </section>

              <section
                className="mc-kpis mc-kpis-4col"
                style={{ marginBottom: 18 }}
              >
                <div className="mc-kpi">
                  <div className="mc-kpi-top">
                    <span className="mc-kpi-label">Two-way calls / day</span>
                    <span className="mc-kpi-icon mc-kpi-icon-stable">
                      <Activity size={17} strokeWidth={1.9} aria-hidden />
                    </span>
                  </div>
                  <span className="mc-kpi-value">
                    {(report.call_outcomes.two_way_count / periodDays).toFixed(
                      1
                    )}
                  </span>
                </div>
                <div className="mc-kpi">
                  <div className="mc-kpi-top">
                    <span className="mc-kpi-label">Voicemails / day</span>
                    <span className="mc-kpi-icon mc-kpi-icon-neutral">
                      <PhoneOff size={17} strokeWidth={1.9} aria-hidden />
                    </span>
                  </div>
                  <span className="mc-kpi-value">
                    {(
                      report.call_outcomes.voicemail_count / periodDays
                    ).toFixed(1)}
                  </span>
                </div>
                <div className="mc-kpi">
                  <div className="mc-kpi-top">
                    <span className="mc-kpi-label">Avg days between calls</span>
                    <span className="mc-kpi-icon mc-kpi-icon-info">
                      <Clock size={17} strokeWidth={1.9} aria-hidden />
                    </span>
                  </div>
                  <span className="mc-kpi-value">
                    {report.call_outcomes.two_way_count > 0
                      ? (
                          periodDays / report.call_outcomes.two_way_count
                        ).toFixed(1)
                      : "—"}
                  </span>
                </div>
                <div className="mc-kpi">
                  <div className="mc-kpi-top">
                    <span className="mc-kpi-label">Two-way : voicemail</span>
                    <span className="mc-kpi-icon mc-kpi-icon-brand">
                      <Activity size={17} strokeWidth={1.9} aria-hidden />
                    </span>
                  </div>
                  <span className="mc-kpi-value">
                    {report.call_outcomes.two_way_count} :{" "}
                    {report.call_outcomes.voicemail_count}
                  </span>
                </div>
              </section>

              <Card>
                <CardHeader>
                  <div className="mc-card-title">Monitoring Time</div>
                  <div className="mc-card-sub">
                    Minutes recorded per day, for the selected period
                  </div>
                </CardHeader>
                <CardBody>
                  {report.monitoring_time.distribution.length === 0 ? (
                    <p className="mc-hint">
                      No monitoring sessions logged in this period.
                    </p>
                  ) : (
                    <MonitoringTimeChart
                      data={report.monitoring_time.distribution}
                    />
                  )}
                </CardBody>
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
}
