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

import type { ReadingType, VitalReading } from "../types";

/**
 * Readings over time.
 *
 * Blood pressure draws two lines because it is two measurements, and the
 * hypertension thresholds are marked on the axis — a number means little to a
 * reader who does not know where the line is. The reference lines are drawn
 * from the same values the risk rules will use, so the chart and the scoring
 * can never tell different stories.
 */

const CHART_COLOURS = {
  primary: "#087f73",
  secondary: "#2fa89b",
  grid: "#eef3f2",
  axis: "#8b9aa5",
  moderate: "#d99a32",
  critical: "#b83c3c",
};

/** Obstetric thresholds — the same ones the scoring layer applies. */
const THRESHOLDS: Partial<
  Record<ReadingType, { value: number; label: string; tone: string }[]>
> = {
  blood_pressure: [
    { value: 140, label: "140 systolic", tone: CHART_COLOURS.moderate },
    { value: 160, label: "160 severe", tone: CHART_COLOURS.critical },
  ],
  temperature: [
    { value: 38, label: "38 °C fever", tone: CHART_COLOURS.moderate },
  ],
  heart_rate: [{ value: 120, label: "120 bpm", tone: CHART_COLOURS.moderate }],
};

interface Props {
  readings: VitalReading[];
  readingType: ReadingType;
  height?: number;
}

export function VitalsChart({ readings, readingType, height = 260 }: Props) {
  const data = useMemo(
    () =>
      // The API returns newest first; a time axis reads oldest to newest.
      [...readings].reverse().map((r) => ({
        time: new Date(r.recorded_at).getTime(),
        value: Number(r.value),
        secondary:
          r.value_secondary === null ? null : Number(r.value_secondary),
      })),
    [readings]
  );

  const isBloodPressure = readingType === "blood_pressure";
  const allThresholds = THRESHOLDS[readingType] ?? [];

  /**
   * The axis is stretched to keep the first threshold in view even when every
   * reading sits well below it: seeing the margin to 140 is clinically useful,
   * and a threshold line silently clipped off the top would be worse than none.
   * Higher thresholds only appear once the data approaches them, so a normal
   * chart is not squashed by a line nobody is near.
   */
  const { domain, thresholds } = useMemo(() => {
    if (data.length === 0)
      return { domain: [0, 1] as [number, number], thresholds: [] };

    const values = data.flatMap((d) =>
      d.secondary === null ? [d.value] : [d.value, d.secondary]
    );
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);

    const firstThreshold = allThresholds[0]?.value;
    const ceiling =
      firstThreshold === undefined
        ? dataMax
        : Math.max(dataMax, firstThreshold);

    const visible = allThresholds.filter((t) => t.value <= ceiling + 12);

    return {
      domain: [Math.floor(dataMin) - 5, Math.ceil(ceiling) + 8] as [
        number,
        number,
      ],
      thresholds: visible,
    };
  }, [data, allThresholds]);

  if (data.length === 0) return null;

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
            new Date(t).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          }
          stroke={CHART_COLOURS.axis}
          tick={{ fontSize: 11 }}
          tickLine={false}
        />
        <YAxis
          stroke={CHART_COLOURS.axis}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          domain={domain}
          // Clinical values are read as whole numbers — 120, not 119.84.
          tickFormatter={(v) => String(Math.round(Number(v)))}
        />
        <Tooltip
          labelFormatter={(t) => new Date(Number(t)).toLocaleString()}
          formatter={(value, name) => [Math.round(Number(value)), String(name)]}
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
          name={isBloodPressure ? "Systolic" : "Value"}
          stroke={CHART_COLOURS.primary}
          strokeWidth={2}
          dot={false}
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
            isAnimationActive={false}
          />
        )}
        {isBloodPressure && <Legend wrapperStyle={{ fontSize: 12 }} />}
      </LineChart>
    </ResponsiveContainer>
  );
}
