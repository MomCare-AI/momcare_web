'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts'
import { format, subMinutes } from 'date-fns'

// Safe bounds per BRIEF.md
const SAFE_RANGES = {
  systolic: { min: 90, max: 140 },
  diastolic: { min: 60, max: 90 },
  hr: { min: 60, max: 100 },
  spo2: { min: 95, max: 100 },
  temp: { min: 36.1, max: 37.8 },
}

// Generate realistic mock data for the trailing 24h
function generateMockVitals() {
  const data = []
  const now = new Date()
  
  // 1 reading every 15 mins for 24h = 96 points
  for (let i = 96; i >= 0; i--) {
    const timestamp = subMinutes(now, i * 15).getTime()
    
    // Simulate a pre-eclampsia spike around 4 hours ago
    const isSpike = i > 12 && i < 20
    
    data.push({
      timestamp,
      systolic: isSpike ? 150 + Math.random() * 15 : 110 + Math.random() * 20,
      diastolic: isSpike ? 95 + Math.random() * 15 : 70 + Math.random() * 15,
      hr: 75 + Math.random() * 25,
      spo2: 96 + Math.random() * 4,
      temp: 36.5 + Math.random() * 1.0,
      // Randomly drop clinical events
      event: Math.random() > 0.95 ? 'Lab Verified' : null,
    })
  }
  return data
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="rounded-lg border border-line bg-panel p-3 shadow-lg">
      <p className="mb-2 font-data text-xs font-semibold text-ink-muted">
        {format(new Date(label), 'HH:mm • MMM d')}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium text-ink uppercase">
            {entry.name}:
          </span>
          <span className="font-data text-sm font-medium">
            {Math.round(entry.value * 10) / 10}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function VitalsRibbon() {
  const data = useMemo(() => generateMockVitals(), [])

  // The 4 synchronized charts
  const charts = [
    {
      id: 'bp',
      name: 'Blood Pressure',
      lines: [
        { key: 'systolic', color: 'var(--color-clay)', name: 'SYS' },
        { key: 'diastolic', color: 'var(--color-marigold)', name: 'DIA' },
      ],
      domain: [40, 200],
      safeRange: [SAFE_RANGES.diastolic.min, SAFE_RANGES.systolic.max],
    },
    {
      id: 'hr',
      name: 'Heart Rate',
      lines: [{ key: 'hr', color: 'var(--color-pine)', name: 'HR' }],
      domain: [40, 150],
      safeRange: [SAFE_RANGES.hr.min, SAFE_RANGES.hr.max],
    },
    {
      id: 'spo2',
      name: 'SpO₂',
      lines: [{ key: 'spo2', color: 'var(--color-sage)', name: 'SpO2' }],
      domain: [85, 100],
      safeRange: [SAFE_RANGES.spo2.min, 100],
    },
    {
      id: 'temp',
      name: 'Temperature',
      lines: [{ key: 'temp', color: 'var(--color-slate)', name: 'Temp' }],
      domain: [35, 40],
      safeRange: [SAFE_RANGES.temp.min, SAFE_RANGES.temp.max],
    },
  ]

  return (
    <div className="flex flex-col rounded-[10px] border border-line bg-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-pine-wash/50 px-4 py-3">
        <h3 className="font-display text-sm font-semibold text-pine">
          24h Vitals Ribbon
        </h3>
        <span className="font-data text-[10px] uppercase tracking-wide text-ink-muted">
          Synchronized Timeline
        </span>
      </div>

      <div className="p-4 space-y-4">
        {charts.map((chart, i) => (
          <div key={chart.id} className="relative h-24 w-full">
            <div className="absolute left-0 top-0 z-10 w-24">
              <span className="text-xs font-medium text-ink-muted">
                {chart.name}
              </span>
            </div>
            
            <div className="ml-24 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  syncId="vitals"
                  margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                >
                  <defs>
                    {chart.lines.map((line) => (
                      <linearGradient
                        key={line.key}
                        id={`grad-${line.key}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor={line.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={line.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>

                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    hide={i !== charts.length - 1} // Only show labels on the bottom chart
                    tickFormatter={(tick) => format(new Date(tick), 'HH:mm')}
                    tick={{ fontSize: 10, fill: 'var(--color-ink-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={50}
                  />
                  <YAxis domain={chart.domain} hide />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: 'var(--color-ink-muted)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    isAnimationActive={false}
                  />

                  {/* Safe range shading */}
                  <ReferenceArea
                    y1={chart.safeRange[0]}
                    y2={chart.safeRange[1]}
                    fill="var(--color-pine-wash)"
                    fillOpacity={0.5}
                    isFront={false}
                  />

                  {chart.lines.map((line) => (
                    <Area
                      key={line.key}
                      type="monotone"
                      dataKey={line.key}
                      name={line.name}
                      stroke={line.color}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#grad-${line.key})`}
                      isAnimationActive={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
