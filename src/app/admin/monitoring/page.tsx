'use client'

import { Activity } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

export default function AdminMonitoring() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-pine">
          System Monitoring
        </h1>
        <p className="text-sm text-ink-muted">
          Service uptime, response times, and error logs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Uptime chart placeholder */}
        <div className="rounded-[10px] border border-line bg-panel p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-pine">
            Service Uptime
          </h2>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-line bg-surface">
            <p className="text-sm text-ink-muted">
              Uptime chart — will be populated with Recharts once monitoring API is connected.
            </p>
          </div>
        </div>

        {/* Response time chart placeholder */}
        <div className="rounded-[10px] border border-line bg-panel p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-pine">
            Response Times
          </h2>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-line bg-surface">
            <p className="text-sm text-ink-muted">
              p50 / p95 / p99 response time chart — target: API p95 under 300ms.
            </p>
          </div>
        </div>
      </div>

      {/* Error log */}
      <div className="rounded-[10px] border border-line bg-panel">
        <div className="border-b border-line p-4">
          <h2 className="font-display text-base font-semibold text-pine">
            Error Log
          </h2>
        </div>
        <EmptyState
          icon={Activity}
          title="No errors recorded"
          description="System errors with severity levels, timestamps, and details will appear here. Use the refresh action to pull latest data."
        />
      </div>
    </div>
  )
}
