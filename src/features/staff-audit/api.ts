import { authJson } from "@/core/api/authFetch";
import type { AuditPeriodCode, StaffAuditReport } from "./types";

export function getStaffAuditReport(staffId: string, period: AuditPeriodCode) {
  return authJson<StaffAuditReport>(
    `/api/staff/${staffId}/audit-report/?period=${period}`
  );
}
