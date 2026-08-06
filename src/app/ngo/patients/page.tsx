'use client'

import { Users, MapPin } from 'lucide-react'
import RiskBadge from '@/components/ui/RiskBadge'
import EmptyState from '@/components/ui/EmptyState'

export default function NgoPatients() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-pine">Patient Management</h1>
        <p className="text-sm text-ink-muted">Patients within your assigned geographic zones.</p>
      </div>

      {/* Filters — placeholder */}
      <div className="flex flex-wrap gap-2">
        {['All Zones', 'High Risk', 'Band Offline', 'Unassigned Doctor'].map((label) => (
          <button
            key={label}
            className="rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors duration-150 hover:border-pine/40 hover:text-pine"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[10px] border border-line bg-panel">
        <EmptyState
          icon={Users}
          title="Patient list will load from the API"
          description="This page will display zone-scoped patients once the backend endpoint is connected. Filters by risk level, zone, band status, and assigned doctor will be available."
        />
      </div>
    </div>
  )
}
