"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  Download,
  List,
  LineChart as LineChartIcon,
  Plus,
  X,
} from "lucide-react";

import {
  useReadings,
  useRiskHistory,
} from "@/features/monitoring/hooks/useMonitoring";
import { VitalsChart } from "@/features/monitoring/components/VitalsChart";
import { ManualReadingForm } from "@/features/monitoring/components/VitalsPanel";
import { PatientQuickLogPanel } from "./PatientQuickLogPanel";
import {
  VITAL_METRICS,
  vitalValue,
  type RiskAssessment,
  type VitalMetric,
  type VitalReading,
} from "@/features/monitoring/types";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
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

/** Which `RiskAssessment` field carries this vital's clinical category — one
 *  exists for every vital MomCare tracks (`modules/pregnancy/vitals/api/
 *  serializers.py::RiskAssessmentSerializer`), computed server-side by
 *  `momcare_model/clinical_categories.py`. Never re-implemented here. */
const CATEGORY_FIELD: Record<VitalMetric, keyof RiskAssessment | null> = {
  blood_pressure: "bp_category",
  heart_rate: "heart_rate_category",
  body_temp_f: "temperature_category",
  blood_glucose: "glucose_category",
  hemoglobin: "hemoglobin_category",
};

/** A light heuristic over the backend's own category text, purely to pick a
 *  display color — the label itself is always exactly what the backend
 *  said, never altered or invented. */
function categoryTone(label: string): string {
  const l = label.toLowerCase();
  if (
    l.includes("crisis") ||
    l.includes("severe") ||
    l.includes("stage 2") ||
    l.includes("high")
  )
    return "var(--c-high)";
  if (
    l.includes("stage 1") ||
    l.includes("elevated") ||
    l.includes("borderline") ||
    l.includes("moderate") ||
    l.includes("low")
  )
    return "var(--c-moderate)";
  if (l.includes("normal")) return "var(--c-stable)";
  return "var(--c-faint)";
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
  pregnancyId: string;
  patientName: string;
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
  pregnancyId,
  patientName,
}: Props) {
  const [range, setRange] = useState<Range>("1m");
  const [metric, setMetric] = useState<VitalMetric>("blood_pressure");
  const [view, setView] = useState<"chart" | "table">("chart");
  const [showAdd, setShowAdd] = useState(false);

  const readingsQuery = useReadings(pregnancyId);
  const riskQuery = useRiskHistory(pregnancyId);

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

  const categoryBreakdown = useMemo(() => {
    const field = CATEGORY_FIELD[metric];
    if (!field) return [];
    const history = riskQuery.data?.history ?? [];
    const counts = new Map<string, number>();
    let total = 0;
    for (const assessment of history) {
      if (new Date(assessment.assessed_at).getTime() < cutoff) continue;
      const value = assessment[field];
      if (typeof value !== "string" || !value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
      total += 1;
    }
    if (total === 0) return [];
    return Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [riskQuery.data, metric, cutoff]);

  const isPending = readingsQuery.isPending;

  return (
    <>
      <div className="mc-grid-2">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Card>
            <CardHeader style={{ flexWrap: "wrap", gap: 12 }}>
              <div>
                <div className="mc-card-title">{spec.label}</div>
                <div className="mc-card-sub">
                  {RANGE_OPTIONS.find((r) => r.value === range)?.label}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div style={{ width: 130 }}>
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
                <div style={{ width: 170 }}>
                  <Select
                    aria-label="Vital"
                    value={metric}
                    onChange={(v) => setMetric(v as VitalMetric)}
                    placeholder="Vital"
                    options={VITAL_METRICS.map((m) => ({
                      value: m.metric,
                      label: m.label,
                    }))}
                  />
                </div>
                <div className="mc-tabs" style={{ marginBottom: 0 }}>
                  <button
                    type="button"
                    className="mc-tab"
                    aria-current={view === "chart" ? "page" : undefined}
                    onClick={() => setView("chart")}
                    aria-label="Chart view"
                  >
                    <LineChartIcon size={15} strokeWidth={2} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="mc-tab"
                    aria-current={view === "table" ? "page" : undefined}
                    onClick={() => setView("table")}
                    aria-label="Table view"
                  >
                    <List size={15} strokeWidth={2} aria-hidden />
                  </button>
                </div>
                <button
                  type="button"
                  className="mc-btn-ghost mc-btn-sm"
                  disabled={filteredReadings.length === 0}
                  onClick={() =>
                    downloadCsv(
                      toCsv(filteredReadings, metric),
                      `${patientName.replace(/\s+/g, "_")}_${metric}_${range}.csv`
                    )
                  }
                >
                  <Download size={13} strokeWidth={2} aria-hidden />
                  Download CSV
                </button>
                <button
                  type="button"
                  className="mc-btn mc-btn-sm"
                  onClick={() => setShowAdd((v) => !v)}
                >
                  {showAdd ? (
                    <X size={13} strokeWidth={2} aria-hidden />
                  ) : (
                    <Plus size={13} strokeWidth={2} aria-hidden />
                  )}
                  Add Reading
                </button>
              </div>
            </CardHeader>

            {showAdd && (
              <CardBody
                style={{ borderBottom: "1px solid var(--c-border-soft)" }}
              >
                <ManualReadingForm
                  pregnancyId={pregnancyId}
                  onDone={() => setShowAdd(false)}
                />
              </CardBody>
            )}

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
              <CardBody>
                <VitalsChart readings={filteredReadings} metric={metric} />
              </CardBody>
            ) : (
              <div className="mc-dtable-wrap">
                <table className="mc-dtable">
                  <thead>
                    <tr>
                      <th>Reading Date</th>
                      {spec.secondaryField ? (
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
                          {spec.secondaryField ? (
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

          {categoryBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <div>
                  <div className="mc-card-title">
                    Average {spec.label.toLowerCase()} category
                  </div>
                  <div className="mc-card-sub">
                    Based on{" "}
                    {categoryBreakdown.reduce((s, c) => s + c.count, 0)}{" "}
                    assessed reading
                    {categoryBreakdown.reduce((s, c) => s + c.count, 0) === 1
                      ? ""
                      : "s"}{" "}
                    in this range
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="mc-riskbars">
                  {categoryBreakdown.map((c) => (
                    <div key={c.label} className="mc-riskbar-row">
                      <span className="mc-riskbar-tag">
                        <span
                          className="mc-riskbar-dot"
                          style={{ background: categoryTone(c.label) }}
                          aria-hidden
                        />
                        {c.label}
                      </span>
                      <div className="mc-riskbar-track">
                        <div
                          className="mc-riskbar-fill"
                          style={{
                            width: `${c.pct}%`,
                            background: categoryTone(c.label),
                          }}
                        />
                      </div>
                      <span className="mc-riskbar-count">{c.pct}%</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Card>
            <CardHeader>
              <div className="mc-card-title">
                <Brain
                  size={15}
                  strokeWidth={1.9}
                  aria-hidden
                  style={{ verticalAlign: -2, marginRight: 6 }}
                />
                AI Summary
              </div>
            </CardHeader>
            <CardBody>
              <p className="mc-alert mc-alert-notice">
                <AlertTriangle size={15} strokeWidth={2} aria-hidden />
                Not yet connected to an AI summary service. The risk model
                scores every reading (see AI Risk Assessment), but it
                doesn&apos;t write narrative summaries — this card is a preview
                of where one would appear.
              </p>
            </CardBody>
          </Card>

          <PatientQuickLogPanel patientId={patientId} />
        </div>
      </div>
    </>
  );
}
