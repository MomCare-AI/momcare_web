"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { EnrollmentTrendPoint } from "../types";

// Matches portal.css's --c-teal — hardcoded for the same reason
// VitalsChart.tsx hardcodes its palette (see that file's own comment): an
// SVG fill prop is a plain string, not a DOM style, so CSS vars don't
// resolve through it.
const BAR_COLOUR = "#4662e8";
const GRID_COLOUR = "#e8eef0";
const AXIS_COLOUR = "#607582";

interface Props {
  data: EnrollmentTrendPoint[];
  height?: number;
}

export function EnrollmentTrendChart({ data, height = 220 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 12, bottom: 4, left: -12 }}
      >
        <CartesianGrid stroke={GRID_COLOUR} vertical={false} />
        <XAxis
          dataKey="label"
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
          formatter={(value) => [`${value} enrolled`, ""]}
          contentStyle={{
            borderRadius: 9,
            border: "1px solid var(--c-border)",
            fontSize: 12.5,
          }}
        />
        <Bar
          dataKey="count"
          fill={BAR_COLOUR}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
