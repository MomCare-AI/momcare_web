'use client'

import { ScrollText, Download, Filter } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

export default function AdminAudit() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-pine">
            Audit Log
          </h1>
          <p className="text-sm text-ink-muted">
            Immutable, append-only record of all security-relevant actions.
          </p>
        </div>
        <button
          disabled
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-muted opacity-50"
        >
          <Download size={14} />
          Export
        </button>
      </div>

      {/* Scope description */}
      <div className="rounded-[10px] border border-line bg-pine-wash/50 p-4">
        <p className="text-xs text-ink-muted">
          This log captures: every PHI read, threshold change, lab verification,
          role change, failed authorization, user login/logout, and alert
          acknowledgment. Entries are immutable — they cannot be edited or deleted.
        </p>
      </div>

      {/* Filters — placeholder */}
      <div className="flex flex-wrap gap-2">
        {[
          'All Events',
          'PHI Access',
          'Threshold Changes',
          'Lab Verification',
          'Auth Events',
          'Role Changes',
        ].map((label) => (
          <button
            key={label}
            className="rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors duration-150 hover:border-pine/40 hover:text-pine"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Audit table */}
      <div className="overflow-hidden rounded-[10px] border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-pine-wash text-pine">
            <tr>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Event Type</th>
              <th className="px-4 py-3 font-medium">Detail</th>
              <th className="px-4 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5}>
                <EmptyState
                  icon={ScrollText}
                  title="Audit log will load from the API"
                  description="Filterable and exportable security log. Every entry includes actor, timestamp, event type, and affected resource."
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
