"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  VITAL_METRICS,
  vitalValue,
  type VitalMetric,
  type VitalReading,
} from "../types";

/**
 * One vital over time.
 *
 * Blood pressure draws two lines because it is two measurements. The dashed
 * lines are published clinical reference points, drawn so a number means
 * something to a reader who does not carry the ranges in their head.
 *
 * They are NOT the model's decision boundary. Risk is scored by a trained
 * model with no single cut-off, so a point crossing a line here does not mean
 * the model called it high, and staying under one does not mean it did not.
 */

const CHART_COLOURS = {
  primary: "#087f73",
  secondary: "#2fa89b",
  grid: "#eef3f2",
  axis: "#8b9aa5",
  moderate: "#d99a32",
  critical: "#b83c3c",
};

interface Threshold {
  value: number;
  label: string;
  tone: string;
  /** Which side is the abnormal one. Anemia is a floor, hypertension a ceiling. */
  direction: "above" | "below";
}

const THRESHOLDS: Partial<Record<VitalMetric, Threshold[]>> = {
  blood_pressure: [
    {
      value: 140,
      label: "140 systolic",
      tone: CHART_COLOURS.moderate,
      direction: "above",
    },
    {
      value: 160,
      label: "160 severe",
      tone: CHART_COLOURS.critical,
      direction: "above",
    },
  ],
  body_temp_f: [
    {
      value: 100.4,
      label: "100.4 \u00B0F fever",
      tone: CHART_COLOURS.moderate,
      direction: "above",
    },
  ],
  heart_rate: [
    {
      value: 120,
      label: "120 bpm",
      tone: CHART_COLOURS.moderate,
      direction: "above",
    },
  ],
  blood_glucose: [
    {
      value: 140,
      label: "140 mg/dL",
      tone: CHART_COLOURS.moderate,
      direction: "above",
    },
    {
      value: 200,
      label: "200 mg/dL",
      tone: CHART_COLOURS.critical,
      direction: "above",
    },
  ],
  hemoglobin: [
    {
      value: 11,
      label: "11 g/dL anaemia",
      tone: CHART_COLOURS.moderate,
      direction: "below",
    },
  ],
};

interface Props {
  readings: VitalReading[];
  metric: VitalMetric;
  height?: number;
}

export function VitalsChart({ readings, metric, height = 260 }: Props) {
  const spec = VITAL_METRICS.find((m) => m.metric === metric);
  const allThresholds = useMemo(() => THRESHOLDS[metric] ?? [], [metric]);

  const data = useMemo(() => {
    if (!spec) return [];
    return (
      [...readings]
        // The API returns newest first; a time axis reads oldest to newest.
        .reverse()
        .map((r) => ({
          time: new Date(r.recorded_at).getTime(),
          value: vitalValue(r, spec.field),
          secondary: spec.secondaryField
            ? vitalValue(r, spec.secondaryField)
            : null,
        }))
        // An event that did not measure this vital is not a zero — dropping
        // the point leaves a gap, which is the honest shape of the data.
        .filter((d) => d.value !== null)
    );
  }, [readings, spec]);

  /**
   * The axis is stretched to keep the nearest threshold in view even when
   * every reading sits well clear of it: seeing the margin is clinically
   * useful, and a line silently clipped off the edge would be worse than
   * none. Further thresholds appear only as the data approaches them.
   */
  const { domain, thresholds } = useMemo(() => {
    if (data.length === 0)
      return { domain: [0, 1] as [number, number], thresholds: [] };

    const values = data.flatMap((d) =>
      d.secondary === null ? [d.value!] : [d.value!, d.secondary]
    );
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);

    const ceilings = allThresholds.filter((t) => t.direction === "above");
    const floors = allThresholds.filter((t) => t.direction === "below");

    const ceiling =
      ceilings.length > 0 ? Math.max(dataMax, ceilings[0].value) : dataMax;
    const floor =
      floors.length > 0 ? Math.min(dataMin, floors[0].value) : dataMin;

    const visible = allThresholds.filter((t) =>
      t.direction === "above" ? t.value <= ceiling + 12 : t.value >= floor - 12
    );

    return {
      domain: [Math.floor(floor) - 5, Math.ceil(ceiling) + 8] as [
        number,
        number,
      ],
      thresholds: visible,
    };
  }, [data, allThresholds]);

  if (!spec || data.length === 0) return null;

  const isBloodPressure = Boolean(spec.secondaryField);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 12, bottom: 4, left: -12 }}
      >
        <CartesianGrid stroke={CHART_COLOURS.grid} vertical={false} />
        <XAxis
          dataKey="time"
          type="number"
          domain={["dataMin", "dataMax"]}
          scale="time"
          tickFormatter={(t) =>
            new Date(t).toLocaleDateString([], {
              day: "numeric",
              month: "short",
            })
          }
          stroke={CHART_COLOURS.axis}
          tick={{ fontSize: 11 }}
          tickLine={false}
          tickCount={5}
        />
        <YAxis
          stroke={CHART_COLOURS.axis}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          domain={domain}
          tickCount={5}
          tickFormatter={(v) => String(Math.round(Number(v)))}
        />
        <Tooltip
          labelFormatter={(t) => new Date(Number(t)).toLocaleString()}
          formatter={(value, name) => [
            `${Number(value).toFixed(1)} ${spec.unit}`,
            String(name),
          ]}
          contentStyle={{
            borderRadius: 9,
            border: "1px solid #e2ebe9",
            fontSize: 12.5,
          }}
        />

        {thresholds.map((t) => (
          <ReferenceLine
            key={t.value}
            y={t.value}
            stroke={t.tone}
            strokeDasharray="4 4"
            label={{
              value: t.label,
              position: "right",
              fontSize: 10,
              fill: t.tone,
            }}
          />
        ))}

        <Line
          type="monotone"
          dataKey="value"
          name={isBloodPressure ? "Systolic" : spec.label}
          stroke={CHART_COLOURS.primary}
          strokeWidth={2}
          dot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
        {isBloodPressure && (
          <Line
            type="monotone"
            dataKey="secondary"
            name="Diastolic"
            stroke={CHART_COLOURS.secondary}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        )}
        {isBloodPressure && <Legend wrapperStyle={{ fontSize: 12 }} />}
      </LineChart>
    </ResponsiveContainer>
  );
}
