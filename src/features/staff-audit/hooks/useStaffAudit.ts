"use client";

import { useQuery } from "@tanstack/react-query";

import { getStaffAuditReport } from "../api";
import type { AuditPeriodCode } from "../types";

export function useStaffAuditReport(
  staffId: string | null,
  period: AuditPeriodCode
) {
  return useQuery({
    queryKey: ["staff-audit-report", staffId, period],
    queryFn: () => getStaffAuditReport(staffId as string, period),
    enabled: Boolean(staffId),
  });
}
