"use client";

import { useMemo } from "react";
import { Activity } from "lucide-react";

import {
  useDevices,
  useReadings,
} from "@/features/monitoring/hooks/useMonitoring";
import { AiSummaryCard } from "./AiSummaryCard";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";

interface Props {
  pregnancyId: string | null;
}

function countLast24h(readings: { recorded_at: string }[]): number {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return readings.filter((r) => new Date(r.recorded_at).getTime() >= cutoff)
    .length;
}

/**
 * The top row of the Overview tab: AI Summary placeholder, then a real
 * "Reading Activity" card (reading volume + device status — the reference
 * platform's own "RPM Overview" box, renamed since MomCare has no RPM/CCM
 * split to report). An "out of range" count is deliberately left out —
 * MomCare's vital-category thresholds live only in the backend's
 * `clinical_categories.py`, and re-implementing them here would risk
 * silently drifting from the real rule.
 */
export function PatientOverviewSnapshot({ pregnancyId }: Props) {
  const readingsQuery = useReadings(pregnancyId ?? undefined);
  const devicesQuery = useDevices();

  const readingsLast24h = useMemo(
    () => countLast24h(readingsQuery.data?.results ?? []),
    [readingsQuery.data]
  );

  const device = useMemo(
    () => devicesQuery.data?.find((d) => d.assigned_pregnancy === pregnancyId),
    [devicesQuery.data, pregnancyId]
  );

  return (
    <div className="mc-grid-even">
      <AiSummaryCard />

      <Card>
        <CardHeader>
          <div>
            <div className="mc-card-title">
              <Activity
                size={15}
                strokeWidth={1.9}
                style={{ verticalAlign: -2, marginRight: 6 }}
                aria-hidden
              />
              Reading Activity
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="mc-pairs">
            <div>
              <div className="mc-pair-label">Readings (24h)</div>
              <div className="mc-pair-value">
                {readingsQuery.isPending ? "…" : readingsLast24h}
              </div>
            </div>
            <div>
              <div className="mc-pair-label">Device</div>
              <div className="mc-pair-value">
                {devicesQuery.isPending
                  ? "…"
                  : device
                    ? device.serial_number
                    : "None assigned"}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
