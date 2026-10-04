"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Expand,
  List,
  LineChart as LineChartIcon,
  Plus,
} from "lucide-react";

import {
  useReadings,
  useReadingStatistics,
  useRiskHistory,
} from "@/features/monitoring/hooks/useMonitoring";
import type { ReadingPeriod } from "@/features/monitoring/api";
import { RiskPanel } from "@/features/monitoring/components/RiskPanel";
import { ScoreResult } from "@/features/monitoring/components/ScoreVitalsForm";
import { VitalsChart } from "@/features/monitoring/components/VitalsChart";
import { usePatient } from "../hooks/usePatients";
import { AddReadingModal } from "./AddReadingModal";
import { AISummaryPanel } from "./AISummaryPanel";
import { PatientQuickLogPanel } from "./PatientQuickLogPanel";
import {
  VITAL_METRICS,
  vitalValue,
  type VitalMetric,
  type VitalReading,
} from "@/features/monitoring/types";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Modal } from "@/shared/ui/Modal";
import { Select } from "@/shared/ui/Select";

type Range = "2d" | "1w" | "1m" | "3m" | "6m";

/** A plain helper, not called directly in a component/hook body — the
 *  established pattern this codebase already uses for other `Date.now()`
 *  reads (`timeAgo`, `readingAge`), since React's purity check flags an
 *  impure call made directly inside a component or memo callback. */
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

/** The chart's own range, mapped to the statistics endpoint's preset window
 *  codes (`vitals/services.py::READING_PERIODS`) — same day counts, just the
 *  backend's own names instead of this panel's short ones. */
const PERIOD_BY_RANGE: Record<Range, ReadingPeriod> = {
  "2d": "2_days",
  "1w": "1_week",
  "1m": "1_month",
  "3m": "3_months",
  "6m": "6_months",
};

/** A fixed, distinct hue per vital — identifies *which vital* a segment is,
 *  not its clinical severity, so this deliberately stays off the portal's
 *  stable/moderate/high/critical palette (CLAUDE.md reserves that one for
 *  real alert state; reusing it here would make an idle vital look like a
 *  clinical warning). */
const VITAL_COLORS: Partial<Record<VitalMetric, string>> = {
  blood_pressure: "#4662e8",
  heart_rate: "#8a5fd1",
  body_temp_f: "#0891b2",
  blood_glucose: "#c2478d",
  hemoglobin: "#64748b",
};

/**
 * Largest-remainder rounding: whole-number percentages that sum to exactly
 * 100 (or 0 if every count is 0), rather than naive per-item rounding, which
 * can drift a point above or below 100 and make a "this adds up to 100%" bar
 * visibly lie.
 */
function allocatePercentages(counts: number[]): number[] {
  const total = counts.reduce((sum, c) => sum + c, 0);
  if (total === 0) return counts.map(() => 0);
  const raw = counts.map((c) => (c / total) * 100);
  const floors = raw.map(Math.floor);
  let remainder = 100 - floors.reduce((sum, f) => sum + f, 0);
  const byFraction = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  for (let k = 0; k < remainder && k < byFraction.length; k++) {
    result[byFraction[k].i] += 1;
  }
  return result;
}

function toCsv(readings: VitalReading[], metric: VitalMetric): string {
  const spec = VITAL_METRICS.find((m) => m.metric === metric)!;
  const header = spec.secondaryField
    ? `Recorded at,${spec.label} (systolic),${spec.label} (diastolic),Source\n`
    : `Recorded at,${spec.label},Source\n`;
  const rows = readings
    .map((r) => {
      const value = vitalValue(r, spec.field);
      const secondary = spec.secondaryField
        ? vitalValue(r, spec.secondaryField)
        : null;
      const cells = spec.secondaryField
        ? [r.recorded_at, value ?? "", secondary ?? "", r.source_display]
        : [r.recorded_at, value ?? "", r.source_display];
      return cells.join(",");
    })
    .join("\n");
  return header + rows;
}

/** One column per vital, the blood-pressure pair counting as one. */
const ALL_VITAL_COLUMNS = VITAL_METRICS.map((m) => ({
  key: m.metric,
  title: m.metric === "blood_pressure" ? "Blood pressure" : m.label,
  spec: m,
}));

function allVitalsCell(
  r: VitalReading,
  spec: (typeof VITAL_METRICS)[number]
): string {
  const value = vitalValue(r, spec.field);
  if (value === null) return "—";
  if (spec.secondaryField) {
    const secondary = vitalValue(r, spec.secondaryField);
    return `${value}/${secondary ?? "—"} ${spec.unit}`;
  }
  return `${value} ${spec.unit}`;
}

function toAllVitalsCsv(readings: VitalReading[]): string {
  const header = `Recorded at,${ALL_VITAL_COLUMNS.map((c) => c.title).join(",")},Source\n`;
  const rows = readings
    .map((r) =>
      [
        r.recorded_at,
        ...ALL_VITAL_COLUMNS.map((c) => allVitalsCell(r, c.spec)),
        r.source_display,
      ].join(",")
    )
    .join("\n");
  return header + rows;
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

interface Props {
  patientId: string;
  patientLocationName?: string;
  pregnancyId: string;
  patientName: string;
  /** Only a clinician may review an assessment — the server enforces it
   *  too. Threaded through to the `RiskPanel` rendered below the chart,
   *  now that the AI Risk Assessment tab is gone and this is its only
   *  home. */
  canVerifyRisk?: boolean;
}

/**
 * The dedicated Readings tab — time range, per-vital chart/table, and a
 * real category breakdown (see `CATEGORY_FIELD` above), adapted from the
 * reference platform's own Readings screen. Both `useReadings` and
 * `useRiskHistory` fetch their usual capped window (200 readings / 50
 * assessments) and this panel filters client-side by the selected range —
 * the same honest tradeoff already used for the Governance/Patients tables:
 * accurate within the cap, but a very actively-monitored patient's oldest
 * readings in a wide range wouldn't show. No new endpoint exists or is
 * needed for any of this.
 */
export function PatientReadingsPanel({
  patientId,
  patientLocationName,
  pregnancyId,
  patientName,
  canVerifyRisk = true,
}: Props) {
  const [range, setRange] = useState<Range>("1m");
  const [metric, setMetric] = useState<VitalMetric>("blood_pressure");
  // Opens as a table of every vital; the chart is one vital at a time (the
  // scales differ too much to share an axis), so picking it narrows to one.
  const [view, setView] = useState<"chart" | "table">("table");
  const [allVitals, setAllVitals] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  // Only meaningful for the Blood Pressure chart — see VitalsChart's own
  // comment on why Heart Rate is the one vital combined with it, not every
  // vital regardless of scale.
  const [showSystolic, setShowSystolic] = useState(true);
  const [showDiastolic, setShowDiastolic] = useState(true);
  const [showHeartRateLine, setShowHeartRateLine] = useState(true);

  // The patient page already holds this in the query cache, so it costs no
  // extra request.
  const patientQuery = usePatient(patientId);
  const readingsQuery = useReadings(pregnancyId);
  const riskQuery = useRiskHistory(pregnancyId);

  // Every vital's category breakdown at once, independent of which one the
  // chart above happens to be showing — four calls because the backend
  // groups blood pressure and heart rate under one `reading_type`, not five.
  const period = PERIOD_BY_RANGE[range];
  const bpStats = useReadingStatistics(pregnancyId, "blood_pressure", period);
  const tempStats = useReadingStatistics(pregnancyId, "temperature", period);
  const glucoseStats = useReadingStatistics(
    pregnancyId,
    "blood_glucose",
    period
  );
  const hemoglobinStats = useReadingStatistics(
    pregnancyId,
    "hemoglobin",
    period
  );

  // One bar, one segment per vital, widths summing to 100% — each vital's
  // share of the readings actually taken in this range. Not a risk-weight:
  // no per-vital "contribution to risk" exists anywhere in the model, so
  // this only ever answers "what did we measure most," never "what mattered
  // most."
  const readingShare = useMemo(() => {
    const counts: Partial<Record<VitalMetric, number>> = {
      blood_pressure: bpStats.data?.readings_count.systolic_bp ?? 0,
      heart_rate: bpStats.data?.readings_count.heart_rate ?? 0,
      body_temp_f: tempStats.data?.readings_count.body_temp_f ?? 0,
      blood_glucose: glucoseStats.data?.readings_count.blood_glucose ?? 0,
      hemoglobin: hemoglobinStats.data?.readings_count.hemoglobin ?? 0,
    };
    const metrics = Object.keys(counts) as VitalMetric[];
    const values = metrics.map((m) => counts[m] ?? 0);
    const percentages = allocatePercentages(values);
    return metrics
      .map((m, i) => ({ metric: m, count: values[i], pct: percentages[i] }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [bpStats.data, tempStats.data, glucoseStats.data, hemoglobinStats.data]);

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

  const spec = VITAL_METRICS.find((m) => m.metric === metric)!;

  const isPending = readingsQuery.isPending;

  return (
    <>
      <div className="mc-grid-2">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Card>
            <CardHeader style={{ flexWrap: "wrap", gap: 12 }}>
              <div>
                <div
                  className="mc-card-title"
                  style={{ textTransform: "uppercase", letterSpacing: 0.3 }}
                >
                  {allVitals ? "All vitals" : spec.label}
                </div>
                <div className="mc-card-sub">
                  {RANGE_OPTIONS.find((r) => r.value === range)?.label}
                </div>
              </div>
              <div className="mc-actions mc-actions-compact">
                <div style={{ width: 88, flex: "none" }}>
                  <Select
                    aria-label="Time range"
                    value={range}
                    onChange={(v) => setRange(v as Range)}
                    placeholder="Range"
                    options={RANGE_OPTIONS.map((r) => ({
                      value: r.value,
                      label: r.label,
                    }))}
                  />
                </div>
                <div style={{ width: 124, flex: "none" }}>
                  <Select
                    aria-label="Vital"
                    value={allVitals ? "all" : metric}
                    onChange={(v) => {
                      if (v === "all") {
                        setAllVitals(true);
                        setView("table");
                      } else {
                        setAllVitals(false);
                        setMetric(v as VitalMetric);
                      }
                    }}
                    placeholder="Vital"
                    options={[
                      { value: "all", label: "All vitals" },
                      ...VITAL_METRICS.map((m) => ({
                        value: m.metric,
                        label: m.label,
                      })),
                    ]}
                  />
                </div>
                <div className="mc-segmented">
                  <button
                    type="button"
                    className="mc-segment"
                    aria-pressed={view === "chart"}
                    onClick={() => {
                      setAllVitals(false);
                      setView("chart");
                    }}
                    aria-label="Chart view"
                  >
                    <LineChartIcon size={15} strokeWidth={2} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="mc-segment"
                    aria-pressed={view === "table"}
                    onClick={() => setView("table")}
                    aria-label="Table view"
                  >
                    <List size={15} strokeWidth={2} aria-hidden />
                  </button>
                </div>
                <button
                  type="button"
                  className="mc-iconbtn"
                  aria-label="Download CSV"
                  title="Download CSV"
                  disabled={filteredReadings.length === 0}
                  onClick={() =>
                    downloadCsv(
                      allVitals
                        ? toAllVitalsCsv(filteredReadings)
                        : toCsv(filteredReadings, metric),
                      `${patientName.replace(/\s+/g, "_")}_${allVitals ? "all_vitals" : metric}_${range}.csv`
                    )
                  }
                >
                  <Download size={15} strokeWidth={2} aria-hidden />
                </button>
                <button
                  type="button"
                  className="mc-btn mc-btn-sm"
                  onClick={() => setShowAdd(true)}
                >
                  <Plus size={13} strokeWidth={2} aria-hidden />
                  Add Reading
                </button>
              </div>
            </CardHeader>

            {isPending ? (
              <CardBody>Loading readings…</CardBody>
            ) : filteredReadings.length === 0 ? (
              <CardBody>
                <EmptyState
                  title="No readings in this range"
                  text="Try a wider time range, or record one above."
                />
              </CardBody>
            ) : view === "chart" ? (
              <CardBody style={{ position: "relative" }}>
                <button
                  type="button"
                  className="mc-btn-ghost mc-btn-sm"
                  aria-label="Expand chart"
                  title="Expand chart"
                  onClick={() => setShowChartModal(true)}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    zIndex: 1,
                  }}
                >
                  <Expand size={13} strokeWidth={2} aria-hidden />
                </button>
                <VitalsChart
                  readings={filteredReadings}
                  metric={metric}
                  showHeartRate={metric === "blood_pressure"}
                  visibleLines={{
                    systolic: showSystolic,
                    diastolic: showDiastolic,
                    heartRate: showHeartRateLine,
                  }}
                />
                {metric === "blood_pressure" && (
                  <div
                    style={{
                      display: "flex",
                      gap: 18,
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: "1px solid var(--c-border-soft)",
                    }}
                  >
                    <label style={{ display: "flex", gap: 6, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={showSystolic}
                        onChange={(e) => setShowSystolic(e.target.checked)}
                      />
                      Systolic
                    </label>
                    <label style={{ display: "flex", gap: 6, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={showDiastolic}
                        onChange={(e) => setShowDiastolic(e.target.checked)}
                      />
                      Diastolic
                    </label>
                    <label style={{ display: "flex", gap: 6, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={showHeartRateLine}
                        onChange={(e) => setShowHeartRateLine(e.target.checked)}
                      />
                      Heart Rate
                    </label>
                  </div>
                )}
              </CardBody>
            ) : (
              <div className="mc-dtable-wrap">
                <table className="mc-dtable">
                  <thead>
                    <tr>
                      <th>Reading Date</th>
                      {allVitals ? (
                        ALL_VITAL_COLUMNS.map((c) => (
                          <th key={c.key}>{c.title}</th>
                        ))
                      ) : spec.secondaryField ? (
                        <>
                          <th>Systolic</th>
                          <th>Diastolic</th>
                        </>
                      ) : (
                        <th>Value</th>
                      )}
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReadings.map((r) => {
                      const value = vitalValue(r, spec.field);
                      const secondary = spec.secondaryField
                        ? vitalValue(r, spec.secondaryField)
                        : null;
                      return (
                        <tr key={r.id} className="mc-dtable-row">
                          <td>{new Date(r.recorded_at).toLocaleString()}</td>
                          {allVitals ? (
                            ALL_VITAL_COLUMNS.map((c) => (
                              <td key={c.key}>{allVitalsCell(r, c.spec)}</td>
                            ))
                          ) : spec.secondaryField ? (
                            <>
                              <td>
                                {value !== null ? `${value} ${spec.unit}` : "—"}
                              </td>
                              <td>
                                {secondary !== null
                                  ? `${secondary} ${spec.unit}`
                                  : "—"}
                              </td>
                            </>
                          ) : (
                            <td>
                              {value !== null ? `${value} ${spec.unit}` : "—"}
                            </td>
                          )}
                          <td className="mc-dtable-sub">{r.source_display}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="mc-hint" style={{ padding: "12px 20px" }}>
                  Readings are permanent records — an observation of a moment in
                  time isn&apos;t editable or deletable. A correction is a new
                  reading.
                </p>
              </div>
            )}
          </Card>

          {readingShare.length > 0 && (
            <Card>
              <CardHeader>
                <div className="mc-card-title">Reading mix</div>
                <div className="mc-card-sub">
                  Share of readings by vital, for{" "}
                  {RANGE_OPTIONS.find(
                    (r) => r.value === range
                  )?.label.toLowerCase()}
                </div>
              </CardHeader>
              <CardBody>
                <div className="mc-catbar-track">
                  {readingShare.map((entry) => (
                    <div
                      key={entry.metric}
                      className="mc-catbar-segment"
                      title={`${
                        VITAL_METRICS.find((m) => m.metric === entry.metric)!
                          .label
                      }: ${entry.pct}%`}
                      style={{
                        flex: `${entry.pct} 0 0%`,
                        background: VITAL_COLORS[entry.metric],
                      }}
                    />
                  ))}
                </div>
                <div className="mc-catbar-legend">
                  {readingShare.map((entry) => (
                    <span key={entry.metric} className="mc-catbar-item">
                      <span
                        className="mc-catbar-dot"
                        style={{ background: VITAL_COLORS[entry.metric] }}
                        aria-hidden
                      />
                      {
                        VITAL_METRICS.find((m) => m.metric === entry.metric)!
                          .label
                      }{" "}
                      <strong>{entry.pct}%</strong>
                    </span>
                  ))}
                </div>
                <p className="mc-hint" style={{ marginTop: 10 }}>
                  How much of the monitoring in this range was each vital — not
                  a measure of risk.
                </p>
              </CardBody>
            </Card>
          )}

          {riskQuery.data?.current && (
            <Card>
              <CardHeader>
                <div>
                  <div className="mc-card-title">AI Risk Assessment</div>
                  <div className="mc-card-sub">
                    The latest score on this pregnancy&apos;s record
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <ScoreResult assessment={riskQuery.data.current} compact />
              </CardBody>
            </Card>
          )}

          <RiskPanel pregnancyId={pregnancyId} canVerify={canVerifyRisk} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <AISummaryPanel
            patientId={patientId}
            onViewReadings={() => setView("chart")}
          />

          <PatientQuickLogPanel
            patientId={patientId}
            patientLocationName={patientLocationName}
          />
        </div>
      </div>

      <Modal
        open={showChartModal}
        onClose={() => setShowChartModal(false)}
        title="Reading Chart"
      >
        {filteredReadings.length === 0 ? (
          <EmptyState
            title="No readings in this range"
            text="Try a wider time range, or record one above."
          />
        ) : (
          <>
            <VitalsChart
              readings={filteredReadings}
              metric={metric}
              height={340}
              showHeartRate={metric === "blood_pressure"}
              visibleLines={{
                systolic: showSystolic,
                diastolic: showDiastolic,
                heartRate: showHeartRateLine,
              }}
            />
            {readingShare.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div className="mc-card-title" style={{ marginBottom: 10 }}>
                  Reading mix
                </div>
                <div className="mc-catbar-track">
                  {readingShare.map((entry) => (
                    <div
                      key={entry.metric}
                      className="mc-catbar-segment"
                      title={`${
                        VITAL_METRICS.find((m) => m.metric === entry.metric)!
                          .label
                      }: ${entry.pct}%`}
                      style={{
                        flex: `${entry.pct} 0 0%`,
                        background: VITAL_COLORS[entry.metric],
                      }}
                    />
                  ))}
                </div>
                <div className="mc-catbar-legend">
                  {readingShare.map((entry) => (
                    <span key={entry.metric} className="mc-catbar-item">
                      <span
                        className="mc-catbar-dot"
                        style={{ background: VITAL_COLORS[entry.metric] }}
                        aria-hidden
                      />
                      {
                        VITAL_METRICS.find((m) => m.metric === entry.metric)!
                          .label
                      }{" "}
                      <strong>{entry.pct}%</strong>
                    </span>
                  ))}
                </div>
                <p className="mc-hint" style={{ marginTop: 10 }}>
                  How much of the monitoring in this range was each vital — not
                  a measure of risk.
                </p>
              </div>
            )}
          </>
        )}
      </Modal>

      <AddReadingModal
        pregnancyId={pregnancyId}
        patientName={patientName}
        dateOfBirth={patientQuery.data?.date_of_birth}
        open={showAdd}
        onClose={() => setShowAdd(false)}
      />
    </>
  );
}
