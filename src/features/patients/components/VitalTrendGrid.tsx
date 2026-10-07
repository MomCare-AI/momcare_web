"use client";

import { VitalsChart } from "@/features/monitoring/components/VitalsChart";
import {
  VITAL_METRICS,
  type VitalMetric,
  type VitalReading,
} from "@/features/monitoring/types";

/**
 * One small line chart per vital, side by side, so each vital can be read on
 * its own scale instead of being folded into a single share bar.
 */
export function VitalTrendGrid({
  readings,
  metrics,
}: {
  readings: VitalReading[];
  metrics: VitalMetric[];
}) {
  return (
    <div className="mc-trend-grid">
      {metrics.map((metric) => {
        const spec = VITAL_METRICS.find((m) => m.metric === metric);
        if (!spec) return null;
        return (
          <div key={metric} className="mc-trend-cell">
            <div className="mc-trend-title">
              {spec.label}
              <span className="mc-trend-unit">{spec.unit}</span>
            </div>
            <VitalsChart readings={readings} metric={metric} height={150} />
          </div>
        );
      })}
    </div>
  );
}
