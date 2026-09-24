"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Activity, Clock, Watch } from "lucide-react";

import {
  useDevices,
  useReadings,
} from "@/features/monitoring/hooks/useMonitoring";
import { usePatientMonitoring } from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import type { TimelineEntry } from "@/features/monitoring-notes/types";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";

interface Props {
  patientId: string;
  pregnancyId: string | null;
}

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function countLast24h(readings: { recorded_at: string }[]): number {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return readings.filter((r) => new Date(r.recorded_at).getTime() >= cutoff)
    .length;
}

function entryLine(entry: TimelineEntry): { text: string; when: string } {
  if (entry.note) {
    return {
      text: entry.note.note || "(no note text)",
      when: `${entry.note.added_by_name} · ${timeAgo(entry.recorded_at)}`,
    };
  }
  if (entry.session) {
    const mins = Math.round(entry.session.duration_seconds / 60);
    return {
      text: `Contact logged — ${mins < 1 ? "under a minute" : `${mins} min`}`,
      when: `${entry.session.added_by_name} · ${timeAgo(entry.recorded_at)}`,
    };
  }
  return { text: "—", when: timeAgo(entry.recorded_at) };
}

/**
 * Two compact real-data cards, adapted from the reference platform's
 * "RPM Overview" + "Recent Notes"/"Monitoring Sessions" boxes: reading
 * volume + device status on the left, the last few contact-log entries on
 * the right. Nothing here duplicates clinical logic that belongs on the
 * server (an "out of range" count would need MomCare's own vital-category
 * thresholds, which live only in the backend's `clinical_categories.py` —
 * re-implementing them here would risk silently drifting from the real
 * rule, so that count is left out rather than approximated).
 */
export function PatientOverviewSnapshot({ patientId, pregnancyId }: Props) {
  const readingsQuery = useReadings(pregnancyId ?? undefined);
  const devicesQuery = useDevices();
  const monitoringQuery = usePatientMonitoring(patientId);

  const readingsLast24h = useMemo(
    () => countLast24h(readingsQuery.data?.results ?? []),
    [readingsQuery.data]
  );

  const device = useMemo(
    () => devicesQuery.data?.find((d) => d.assigned_pregnancy === pregnancyId),
    [devicesQuery.data, pregnancyId]
  );

  const recentEntries = (monitoringQuery.data?.results ?? []).slice(0, 4);

  return (
    <div className="mc-grid-even">
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
              Quick stats
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

      <Card>
        <CardHeader>
          <div>
            <div className="mc-card-title">
              <Clock
                size={15}
                strokeWidth={1.9}
                style={{ verticalAlign: -2, marginRight: 6 }}
                aria-hidden
              />
              Recent activity
            </div>
            <div className="mc-card-sub">This month&apos;s contact log</div>
          </div>
          <Link
            href={`/dashboard/patients/${patientId}#notes`}
            className="mc-link"
          >
            View all
          </Link>
        </CardHeader>
        <CardBody>
          {monitoringQuery.isPending ? (
            <div className="mc-hint">Loading…</div>
          ) : recentEntries.length === 0 ? (
            <div className="mc-hint">Nothing logged yet this month.</div>
          ) : (
            <ol className="mc-trail">
              {recentEntries.map((entry, i) => {
                const line = entryLine(entry);
                return (
                  <li key={i} className="mc-trail-item">
                    <span className="mc-trail-dot" aria-hidden />
                    <div>
                      <div className="mc-trail-what">{line.text}</div>
                      <div className="mc-trail-when">
                        <Watch size={11} strokeWidth={2.2} aria-hidden />{" "}
                        {line.when}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
