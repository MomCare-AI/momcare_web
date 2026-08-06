'use client'

import { SlidersHorizontal, AlertTriangle, ShieldCheck } from 'lucide-react'

// Mock thresholds with WHO/ACOG guideline references
const THRESHOLDS = [
  {
    metric: 'Systolic BP',
    unit: 'mmHg',
    currentLow: 90,
    currentHigh: 140,
    defaultLow: 90,
    defaultHigh: 140,
    guideline: 'WHO Hypertension in Pregnancy',
    lastModifiedBy: 'System default',
    lastModifiedAt: '—',
  },
  {
    metric: 'Diastolic BP',
    unit: 'mmHg',
    currentLow: 60,
    currentHigh: 90,
    defaultLow: 60,
    defaultHigh: 90,
    guideline: 'WHO Hypertension in Pregnancy',
    lastModifiedBy: 'System default',
    lastModifiedAt: '—',
  },
  {
    metric: 'Heart Rate',
    unit: 'bpm',
    currentLow: 60,
    currentHigh: 100,
    defaultLow: 60,
    defaultHigh: 100,
    guideline: 'ACOG Practice Bulletin',
    lastModifiedBy: 'System default',
    lastModifiedAt: '—',
  },
  {
    metric: 'SpO₂',
    unit: '%',
    currentLow: 95,
    currentHigh: 100,
    defaultLow: 95,
    defaultHigh: 100,
    guideline: 'WHO Pulse Oximetry Guidelines',
    lastModifiedBy: 'System default',
    lastModifiedAt: '—',
  },
  {
    metric: 'Temperature',
    unit: '°C',
    currentLow: 36.1,
    currentHigh: 37.8,
    defaultLow: 36.1,
    defaultHigh: 37.8,
    guideline: 'ACOG Clinical Guidelines',
    lastModifiedBy: 'System default',
    lastModifiedAt: '—',
  },
  {
    metric: 'Fetal Heart Rate',
    unit: 'bpm',
    currentLow: 110,
    currentHigh: 160,
    defaultLow: 110,
    defaultHigh: 160,
    guideline: 'ACOG Fetal Monitoring Guidelines',
    lastModifiedBy: 'System default',
    lastModifiedAt: '—',
  },
]

export default function AdminThresholds() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-pine">
          Alert Threshold Configuration
        </h1>
        <p className="text-sm text-ink-muted">
          Global thresholds that trigger patient alerts.
        </p>
      </div>

      {/* Safety warning — per BRIEF.md §4.3: "the most dangerous screen" */}
      <div className="rounded-[10px] border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={18}
            className="mt-0.5 flex-shrink-0 text-[var(--color-clay)]"
          />
          <div>
            <p className="text-sm font-medium text-[var(--color-clay)]">
              Critical safety configuration
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Changes to these thresholds affect alert generation for{' '}
              <strong>all patients</strong> system-wide. Each change will require a
              confirmation dialog stating how many patients are affected and in which
              direction. Hard-coded absolute safety bounds prevent values from
              exceeding safe ranges — enforced server-side, not just in the UI.
            </p>
          </div>
        </div>
      </div>

      {/* Threshold table */}
      <div className="overflow-hidden rounded-[10px] border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-pine-wash text-pine">
            <tr>
              <th className="px-4 py-3 font-medium">Metric</th>
              <th className="px-4 py-3 font-medium">Low</th>
              <th className="px-4 py-3 font-medium">High</th>
              <th className="px-4 py-3 font-medium">Clinical Default</th>
              <th className="px-4 py-3 font-medium">Source Guideline</th>
              <th className="px-4 py-3 font-medium">Last Modified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {THRESHOLDS.map((t) => (
              <tr key={t.metric}>
                <td className="px-4 py-3 font-medium text-ink">
                  {t.metric}
                  <span className="ml-1 text-xs text-ink-muted">({t.unit})</span>
                </td>
                <td className="px-4 py-3 font-data text-sm">{t.currentLow}</td>
                <td className="px-4 py-3 font-data text-sm">{t.currentHigh}</td>
                <td className="px-4 py-3 font-data text-xs text-ink-muted">
                  {t.defaultLow}–{t.defaultHigh}
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">{t.guideline}</td>
                <td className="px-4 py-3">
                  <p className="text-xs text-ink-muted">{t.lastModifiedBy}</p>
                  <p className="font-data text-[10px] text-ink-muted">
                    {t.lastModifiedAt}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          disabled
          className="flex items-center gap-1.5 rounded-lg bg-pine px-4 py-2 text-sm font-medium text-surface opacity-50"
        >
          <SlidersHorizontal size={14} />
          Edit thresholds
        </button>
        <button
          disabled
          className="flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-muted opacity-50"
        >
          <ShieldCheck size={14} />
          Reset to clinical defaults
        </button>
      </div>
      <p className="text-[10px] text-ink-muted">
        Editing and reset actions will be enabled once the admin threshold API is connected.
      </p>
    </div>
  )
}
