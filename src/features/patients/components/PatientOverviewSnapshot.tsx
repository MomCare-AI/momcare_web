"use client";

import { useMemo } from "react";
import { Activity } from "lucide-react";

import {
  useDevices,
  useReadings,
} from "@/features/monitoring/hooks/useMonitoring";
import { VITAL_METRICS, latestForMetric } from "@/features/monitoring/types";
import { AISummaryPanel } from "./AISummaryPanel";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";

interface Props {
  patientId: string;
  pregnancyId: string | null;
  onViewReadings?: () => void;
}

function countLast24h(readings: { recorded_at: string }[]): number {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return readings.filter((r) => new Date(r.recorded_at).getTime() >= cutoff)
    .length;
}

/**
 * The top row of the Overview tab: the real AI Summary (was a static
 * "not yet connected" placeholder until the backend's ai-summary endpoint
 * shipped — see AISummaryPanel's own docstring for why it's read-only),
 * then a real "Reading Activity" card (reading volume + device status —
 * the reference platform's own "RPM Overview" box, renamed since MomCare
 * has no RPM/CCM split to report). An "out of range" count is
 * deliberately left out — MomCare's vital-category thresholds live only
 * in the backend's `clinical_categories.py`, and re-implementing them
 * here would risk silently drifting from the real rule.
 */
export function PatientOverviewSnapshot({
  patientId,
  pregnancyId,
  onViewReadings,
}: Props) {
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
    <div className="mc-overview-row">
      {/* Wider than Vitals Snapshot/Reading Activity on purpose — it's
          prose, not a tile grid, and needs the room. Not `.mc-grid-even`
          (shared with Reports and RecentActivityCards, which do want
          equal columns) — this row's proportions are specific to this
          component. CSS Grid rather than flex-wrap: a flex row's "stretch
          to match" only applies within one wrapped line, so a narrower
          viewport that wrapped the third card onto its own line left it
          unstretched and visibly shorter — grid's row stretch has no such
          per-line ambiguity. */}
      <div style={{ minWidth: 0 }}>
        <AISummaryPanel patientId={patientId} onViewReadings={onViewReadings} />
      </div>

      <Card style={{ minWidth: 0 }}>
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
                gap: 6,
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
                      padding: "4px 6px",
                      minWidth: 0,
                    }}
                  >
                    <div
                      className="mc-pair-label"
                      style={{ textTransform: "uppercase", fontSize: 9 }}
                    >
                      {label}
                    </div>
                    <div
                      className="mc-pair-value"
                      style={{ fontSize: 12.5, whiteSpace: "nowrap" }}
                    >
                      {latest
                        ? latest.secondary === null
                          ? latest.value
                          : `${latest.value}/${latest.secondary}`
                        : "—"}
                    </div>
                    {latest && (
                      <div
                        className="mc-hint"
                        style={{ color: "var(--c-teal)", fontSize: 9 }}
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

      <Card style={{ minWidth: 0 }}>
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
