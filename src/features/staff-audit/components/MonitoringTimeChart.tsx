"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MonitoringTimeDistributionPoint } from "../types";

// Hardcoded for the same reason EnrollmentTrendChart.tsx does — SVG fill/
// stroke props don't resolve CSS custom properties.
const LINE_COLOUR = "#4662e8";
const GRID_COLOUR = "#e8eef0";
const AXIS_COLOUR = "#607582";

interface Props {
  data: MonitoringTimeDistributionPoint[];
  height?: number;
}

/**
 * `monitoring_time.distribution` from the audit-report response, real
 * day-granularity data straight off the backend — x is calendar date, y is
 * minutes recorded that day (the API returns seconds; converted here for a
 * readable axis). Not RPM's own chart, which buckets by minutes-captured
 * per patient — MomCare's endpoint doesn't return that shape, so this
 * charts what the real response actually contains instead of approximating
 * a different axis.
 */
export function MonitoringTimeChart({ data, height = 240 }: Props) {
  const points = data.map((p) => ({
    date: new Date(p.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    minutes: Math.round((p.seconds / 60) * 10) / 10,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={points}
        margin={{ top: 8, right: 12, bottom: 4, left: -12 }}
      >
        <defs>
          <linearGradient id="mtdFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LINE_COLOUR} stopOpacity={0.25} />
            <stop offset="100%" stopColor={LINE_COLOUR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_COLOUR} vertical={false} />
        <XAxis
          dataKey="date"
          stroke={AXIS_COLOUR}
          tick={{ fontSize: 11 }}
          tickLine={false}
        />
        <YAxis
          stroke={AXIS_COLOUR}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          formatter={(value) => [`${value} min`, "Monitoring time"]}
          contentStyle={{
            borderRadius: 9,
            border: "1px solid var(--c-border)",
            fontSize: 12.5,
          }}
        />
        <Area
          type="monotone"
          dataKey="minutes"
          stroke={LINE_COLOUR}
          strokeWidth={2}
          fill="url(#mtdFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
