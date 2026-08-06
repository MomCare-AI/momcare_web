'use client'

import { Siren } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

export default function NgoEmergency() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-pine">
          Emergency Coordination
        </h1>
        <p className="text-sm text-ink-muted">
          Live alert feed, response dispatch, and incident log.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Alert feed */}
        <div className="rounded-[10px] border border-line bg-panel p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-pine">
            Active Emergencies
          </h2>
          <EmptyState
            icon={Siren}
            title="No active emergencies"
            description="When a critical alert fires, it will appear here with response actions: dispatch ambulance, assign field worker, or contact the assigned doctor."
          />
        </div>

        {/* Map placeholder */}
        <div className="rounded-[10px] border border-line bg-panel p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-pine">
            Map View
          </h2>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-line bg-surface">
            <p className="text-sm text-ink-muted">
              Map view of active emergencies — planned for a later phase.
            </p>
          </div>
        </div>
      </div>

      {/* Response log */}
      <div className="rounded-[10px] border border-line bg-panel p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-pine">
          Response Log
        </h2>
        <p className="text-xs text-ink-muted">
          Append-only log of all emergency responses with timestamps.
          Actions taken, responders assigned, and outcomes will be recorded here.
        </p>
      </div>
    </div>
  )
}
