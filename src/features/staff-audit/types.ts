/** Mirrors `docs/design/2026-09-25-staff-audit-report-design.md`'s response
 *  shape exactly — `GET /api/staff/{staff_id}/audit-report/?period=<code>`. */

export type AuditPeriodCode =
  "2d" | "week" | "month" | "3month" | "6month" | "year" | "2year";

export interface MonitoringTimeDistributionPoint {
  date: string;
  seconds: number;
}

export interface StaffAuditReport {
  staff: {
    id: string;
    name: string;
    role: string;
    employee_id: string;
  };
  period: {
    code: AuditPeriodCode;
    start: string;
    end: string;
  };
  total_patients: number;
  monitoring_time: {
    total_seconds: number;
    total_formatted: string;
    distribution: MonitoringTimeDistributionPoint[];
  };
  call_outcomes: {
    two_way_count: number;
    voicemail_count: number;
    call_success_rate: number;
  };
  alerts_handled: {
    acknowledged_count: number;
    resolved_count: number;
  };
}
