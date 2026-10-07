"use client";

import { useReadingStatistics } from "@/features/monitoring/hooks/useMonitoring";
import type { ReadingPeriod } from "@/features/monitoring/api";
import {
  READING_STATS_SOURCE,
  VITAL_METRICS,
  type VitalMetric,
} from "@/features/monitoring/types";

/**
 * The average of the selected vital over the chosen range, with the share of
 * readings that fell in each clinical band — a coloured bar plus a legend
 * giving each band's percentage and the rule that defines it.
 *
 * Everything numeric comes from the statistics endpoint (plain aggregation
 * over real readings, not model output). The band rules below only restate
 * the backend's `momcare_model/clinical_categories.py` thresholds as text, so
 * the legend can say what "Stage 1" actually means.
 */

interface BandMeta {
  label: string;
  rule: string;
  color: string;
}

const BLUE = "#6b9ef0";
const GREEN = "#4cc38a";
const OLIVE = "#a9b84a";
const ORANGE = "#f5b04c";
const RED = "#f07a7a";
const DARK_RED = "#b85c5c";

/** Keyed by the backend's band key, in the order the backend sends them. */
const BANDS: Record<string, Record<string, BandMeta>> = {
  bp_category: {
    Hypotensive: {
      label: "Hypotensive",
      rule: "SBP < 90 and DBP < 80",
      color: BLUE,
    },
    Normal: {
      label: "Normal",
      rule: "SBP 90–119 and DBP < 80",
      color: GREEN,
    },
    Elevated: {
      label: "Elevated",
      rule: "SBP 120–129 and DBP < 80",
      color: OLIVE,
    },
    "Stage 1": {
      label: "Stage 1 Hypertension",
      rule: "SBP ≥ 130 or DBP ≥ 80",
      color: ORANGE,
    },
    "Stage 2": {
      label: "Stage 2 Hypertension",
      rule: "SBP ≥ 140 or DBP ≥ 90",
      color: RED,
    },
    "Hypertensive Crisis": {
      label: "Hypertensive Crisis",
      rule: "SBP ≥ 180 or DBP ≥ 120",
      color: DARK_RED,
    },
  },
  heart_rate_category: {
    Bradycardia: { label: "Bradycardia", rule: "< 60 bpm", color: BLUE },
    Normal: { label: "Normal", rule: "60–100 bpm", color: GREEN },
    Tachycardia: { label: "Tachycardia", rule: "> 100 bpm", color: RED },
  },
  temperature_category: {
    Hypothermia: { label: "Hypothermia", rule: "< 95 °F", color: BLUE },
    Low: { label: "Low", rule: "95–96.9 °F", color: "#8ec5e8" },
    Normal: { label: "Normal", rule: "97–98.9 °F", color: GREEN },
    "Low Grade Fever": {
      label: "Low Grade Fever",
      rule: "99–100.3 °F",
      color: ORANGE,
    },
    Fever: { label: "Fever", rule: "≥ 100.4 °F", color: RED },
  },
  glucose_category: {
    Normal: { label: "Normal", rule: "< 100 mg/dL", color: GREEN },
    Prediabetes: {
      label: "Prediabetes",
      rule: "100–125 mg/dL",
      color: ORANGE,
    },
    Diabetes: { label: "Diabetes", rule: "≥ 126 mg/dL", color: RED },
  },
  hemoglobin_category: {
    "Severe Anemia": {
      label: "Severe Anemia",
      rule: "< 7 g/dL",
      color: DARK_RED,
    },
    "Moderate Anemia": {
      label: "Moderate Anemia",
      rule: "7–9.9 g/dL",
      color: RED,
    },
    "Mild Anemia": {
      label: "Mild Anemia",
      rule: "10–10.9 g/dL",
      color: ORANGE,
    },
    Normal: { label: "Normal", rule: "≥ 11 g/dL", color: GREEN },
  },
};

interface Props {
  pregnancyId: string;
  metric: VitalMetric;
  period: ReadingPeriod;
}

export function AverageVitalSummary({ pregnancyId, metric, period }: Props) {
  const source = READING_STATS_SOURCE[metric];
  const stats = useReadingStatistics(
    pregnancyId,
    source?.readingType ?? null,
    period
  );
  const spec = VITAL_METRICS.find((m) => m.metric === metric);

  // Stress and activity scores have no clinical bands or average card.
  if (!source || !spec) return null;
  if (!stats.data) return null;

  const average = stats.data.average[spec.field];
  if (average === undefined) return null;
  const secondary = spec.secondaryField
    ? stats.data.average[spec.secondaryField]
    : undefined;
  const count = stats.data.readings_count[spec.field] ?? 0;
  const category = stats.data.categories[source.categoryKey];
  const meta = BANDS[source.categoryKey] ?? {};

  return (
    <div
      style={{
        borderTop: "1px solid var(--c-border-soft)",
        padding: "14px 22px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 28,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 150 }}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--c-body)",
            }}
          >
            Average {spec.label}
          </div>
          <div className="mc-card-sub">
            Based on {count} reading{count === 1 ? "" : "s"}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1.1,
              color: "var(--c-ink)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {secondary !== undefined ? `${average}/${secondary}` : average}
          </div>
          <div style={{ fontSize: 12, color: "var(--c-faint)" }}>
            {spec.unit}
          </div>
        </div>

        {category && (
          <div style={{ flex: "1 1 360px", minWidth: 0 }}>
            <div className="mc-catbar-track">
              {category.bands.map((band) => (
                <div
                  key={band.key}
                  className="mc-catbar-segment"
                  title={`${meta[band.key]?.label ?? band.key}: ${band.percentage}%`}
                  style={{
                    flex: `${Math.max(band.percentage, 0)} 0 0%`,
                    background: meta[band.key]?.color ?? "var(--c-faint)",
                  }}
                />
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${category.bands.length}, minmax(0, 1fr))`,
                gap: 10,
                marginTop: 14,
              }}
            >
              {category.bands.map((band) => {
                const info = meta[band.key];
                return (
                  <div key={band.key} style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 5,
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "var(--c-body)",
                        lineHeight: 1.25,
                      }}
                    >
                      <span
                        className="mc-catbar-dot"
                        style={{
                          background: info?.color ?? "var(--c-faint)",
                          marginTop: 3,
                        }}
                        aria-hidden
                      />
                      {info?.label ?? band.key}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 13,
                        fontWeight: 700,
                        color: info?.color ?? "var(--c-ink)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {band.percentage}%
                    </div>
                    {info && (
                      <div
                        style={{
                          marginTop: 2,
                          fontSize: 10.5,
                          color: "var(--c-faint)",
                          lineHeight: 1.3,
                        }}
                      >
                        {info.rule}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {category && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 10,
            borderTop: "1px dashed var(--c-border-soft)",
            fontSize: 11,
            color: "var(--c-faint)",
          }}
        >
          Source: {category.guideline}
        </div>
      )}
    </div>
  );
}
