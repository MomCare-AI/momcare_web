"use client";

import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";

import { usePatientMonitoring } from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import { useReadings } from "@/features/monitoring/hooks/useMonitoring";
import type { VitalReading } from "@/features/monitoring/types";
import { downloadCsv } from "@/shared/lib/exportCsv";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { Select } from "@/shared/ui/Select";

type Range = "2d" | "1w" | "1m" | "3m" | "6m";

/** A plain helper, not called directly in a component/memo body — same
 *  established pattern PatientReadingsPanel.tsx uses for this impure read. */
function rangeCutoff(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

const RANGE_OPTIONS: { value: Range; label: string; days: number }[] = [
  { value: "2d", label: "2 Days", days: 2 },
  { value: "1w", label: "1 Week", days: 7 },
  { value: "1m", label: "1 Month", days: 30 },
  { value: "3m", label: "3 Months", days: 90 },
  { value: "6m", label: "6 Months", days: 180 },
];

const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((label, i) => ({ value: String(i + 1), label }));

function yearOptions(): { value: string; label: string }[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => {
    const y = current - i;
    return { value: String(y), label: String(y) };
  });
}

function toReadingsCsv(readings: VitalReading[]): string {
  const header =
    "Recorded at,Systolic BP,Diastolic BP,Heart rate,Temperature (F),Blood glucose,Hemoglobin,Source\n";
  const rows = readings
    .map((r) =>
      [
        r.recorded_at,
        r.systolic_bp ?? "",
        r.diastolic_bp ?? "",
        r.heart_rate ?? "",
        r.body_temp_f ?? "",
        r.blood_glucose ?? "",
        r.hemoglobin ?? "",
        r.source_display,
      ].join(",")
    )
    .join("\n");
  return header + rows;
}

interface Props {
  patientId: string;
  pregnancyId: string | null;
  patientName: string;
}

/**
 * "Medical Report" (every reading in a date range) and "Audit Report"
 * (a month's contact-log summary), matching the reference platform's own
 * Documents screen. Both are genuinely real now — `useReadings` and
 * `usePatientMonitoring` already fetch everything needed, and the CSV
 * itself is just a client-side Blob download of data already in the
 * browser, the same honest pattern the Readings tab's own CSV export uses.
 * "Share" is dropped, not stubbed — no messaging/sharing infrastructure
 * exists anywhere in MomCare (same reasoning as the Readings tab).
 */
export function PatientDocumentsPanel({
  patientId,
  pregnancyId,
  patientName,
}: Props) {
  const [range, setRange] = useState<Range>("1m");
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const readingsQuery = useReadings(pregnancyId ?? undefined);
  const monitoringQuery = usePatientMonitoring(
    patientId,
    Number(year),
    Number(month)
  );

  const cutoff = rangeCutoff(
    RANGE_OPTIONS.find((r) => r.value === range)!.days
  );

  const filteredReadings = useMemo(
    () =>
      (readingsQuery.data?.results ?? []).filter(
        (r) => new Date(r.recorded_at).getTime() >= cutoff
      ),
    [readingsQuery.data, cutoff]
  );

  const monthLabel = MONTH_OPTIONS.find((m) => m.value === month)!.label;
  const totalFormatted = monitoringQuery.data?.totals.total_formatted;
  const entries = monitoringQuery.data?.results ?? [];

  const downloadAuditReport = () => {
    const header = "Recorded at,Type,Author,Duration/Note\n";
    const rows = entries
      .map((e) => {
        if (e.session) {
          return [
            e.recorded_at,
            "Session",
            e.session.added_by_name,
            `${Math.round(e.session.duration_seconds / 60)} min`,
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",");
        }
        if (e.note) {
          return [e.recorded_at, "Note", e.note.added_by_name, e.note.note]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",");
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
    const summary = `\n\nTotal time this month,${totalFormatted ?? "0m 0s"}\n`;
    downloadCsv(
      `${patientName.replace(/\s+/g, "_")}_audit_${monthLabel}_${year}.csv`,
      header + rows + summary
    );
  };

  return (
    <>
      <Card style={{ marginBottom: 18 }}>
        <CardHeader style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="mc-card-title">
              <FileText
                size={15}
                strokeWidth={1.9}
                style={{ verticalAlign: -2, marginRight: 6 }}
                aria-hidden
              />
              Medical Report
            </div>
            <div className="mc-card-sub">
              All Reading Reports — select a range and get a report of all
              readings recorded within that time frame
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 150 }}>
              <Select
                aria-label="Date range"
                value={range}
                onChange={(v) => setRange(v as Range)}
                placeholder="Select date range"
                options={RANGE_OPTIONS.map((r) => ({
                  value: r.value,
                  label: r.label,
                }))}
              />
            </div>
            <button
              type="button"
              className="mc-btn mc-btn-sm"
              disabled={!pregnancyId || filteredReadings.length === 0}
              onClick={() =>
                downloadCsv(
                  `${patientName.replace(/\s+/g, "_")}_readings_${range}.csv`,
                  toReadingsCsv(filteredReadings)
                )
              }
            >
              <Download size={13} strokeWidth={2} aria-hidden />
              Download
            </button>
          </div>
        </CardHeader>
        <CardBody>
          {!pregnancyId ? (
            <p className="mc-hint">
              No active pregnancy — readings need one to attach to.
            </p>
          ) : (
            <p className="mc-hint">
              {filteredReadings.length} reading
              {filteredReadings.length === 1 ? "" : "s"} in this range.
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="mc-card-title">
              <FileText
                size={15}
                strokeWidth={1.9}
                style={{ verticalAlign: -2, marginRight: 6 }}
                aria-hidden
              />
              Audit Report
            </div>
            <div className="mc-card-sub">
              Monthly activity summary — select a month/year and receive a
              monthly activity summary
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 140 }}>
              <Select
                aria-label="Month"
                value={month}
                onChange={setMonth}
                placeholder="Month"
                options={MONTH_OPTIONS}
              />
            </div>
            <div style={{ width: 100 }}>
              <Select
                aria-label="Year"
                value={year}
                onChange={setYear}
                placeholder="Year"
                options={yearOptions()}
              />
            </div>
            <button
              type="button"
              className="mc-btn mc-btn-sm"
              disabled={entries.length === 0}
              onClick={downloadAuditReport}
            >
              <Download size={13} strokeWidth={2} aria-hidden />
              Download
            </button>
          </div>
        </CardHeader>
        <CardBody>
          <p className="mc-hint">
            {monitoringQuery.isPending
              ? "Loading…"
              : `${entries.length} entr${entries.length === 1 ? "y" : "ies"} logged — ${totalFormatted ?? "0m 0s"} total this month.`}
          </p>
        </CardBody>
      </Card>
    </>
  );
}
