"use client";

import { motion } from "motion/react";

/**
 * Label/count/color in, a donut out — zero awareness of what a patient, a
 * device or a staff role is. The same conic-gradient markup already used
 * for the risk donut on the dashboard overview page
 * (app/(portal)/dashboard/page.tsx), extracted so every distribution chart
 * in the portal looks and behaves identically instead of three
 * near-duplicate implementations.
 */
export interface DonutSlice {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface Props {
  slices: DonutSlice[];
  centerLabel: string;
  emptyText?: string;
}

export function StatusDonut({
  slices,
  centerLabel,
  emptyText = "No data yet.",
}: Props) {
  const total = slices.reduce((sum, s) => sum + s.count, 0);

  if (total === 0) {
    return <p className="mc-hint">{emptyText}</p>;
  }

  let cursor = 0;
  const stops = slices.map((s) => {
    const pct = (s.count / total) * 100;
    const from = cursor;
    cursor += pct;
    return `${s.color} ${from}% ${cursor}%`;
  });
  const gradient = `conic-gradient(${stops.join(", ")})`;

  return (
    <div className="mc-donut-wrap">
      <motion.div
        className="mc-donut"
        style={{ background: gradient }}
        role="img"
        aria-label={`${total} total — ${slices
          .map((s) => `${s.label} ${s.count}`)
          .join(", ")}`}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mc-donut-hole">
          <span className="mc-donut-value">{total}</span>
          <span className="mc-donut-label">{centerLabel}</span>
        </div>
      </motion.div>
      <div className="mc-riskbars">
        {slices.map((s, index) => {
          const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
          return (
            <div key={s.key} className="mc-riskbar-row">
              <span className="mc-riskbar-tag">
                <span
                  className="mc-riskbar-dot"
                  style={{ background: s.color }}
                  aria-hidden
                />
                {s.label}
              </span>
              <div className="mc-riskbar-track">
                <motion.div
                  className="mc-riskbar-fill"
                  style={{ background: s.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{
                    duration: 0.5,
                    delay: 0.1 + index * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </div>
              <span className="mc-riskbar-count">{s.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
