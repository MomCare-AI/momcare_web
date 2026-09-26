"use client";

import { useMemo } from "react";
import { Activity } from "lucide-react";

import {
  useDevices,
  useReadings,
} from "@/features/monitoring/hooks/useMonitoring";
import { VITAL_METRICS, latestForMetric } from "@/features/monitoring/types";
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

  const readings = readingsQuery.data?.results ?? [];

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
              Vitals Snapshot
            </div>
            <div className="mc-card-sub">
              {VITAL_METRICS.length} metrics tracked
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {readingsQuery.isPending ? (
            <div className="mc-hint">Loading…</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
              }}
            >
              {VITAL_METRICS.map(({ metric, label, unit }) => {
                const latest = latestForMetric(readings, metric);
                return (
                  <div
                    key={metric}
                    style={{
                      border: "1px solid var(--c-border-soft)",
                      borderRadius: "var(--r-control)",
                      padding: "10px 12px",
                    }}
                  >
                    <div
                      className="mc-pair-label"
                      style={{ textTransform: "uppercase" }}
                    >
                      {label}
                    </div>
                    <div className="mc-pair-value" style={{ fontSize: 20 }}>
                      {latest
                        ? latest.secondary === null
                          ? latest.value
                          : `${latest.value}/${latest.secondary}`
                        : "—"}
                    </div>
                    {latest && (
                      <div
                        className="mc-hint"
                        style={{ color: "var(--c-teal)" }}
                      >
                        {unit}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

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
