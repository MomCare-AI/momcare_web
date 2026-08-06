'use client'

import { Watch } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

export default function NgoBands() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-pine">Health Band Inventory</h1>
        <p className="text-sm text-ink-muted">
          Manage band assignment, track device health, and report faulty units.
        </p>
      </div>

      {/* Table header preview — shows the intended structure */}
      <div className="overflow-hidden rounded-[10px] border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-pine-wash text-pine">
            <tr>
              <th className="px-4 py-3 font-medium">Band ID</th>
              <th className="px-4 py-3 font-medium">Assigned Patient</th>
              <th className="px-4 py-3 font-medium">Assignment Date</th>
              <th className="px-4 py-3 font-medium">Battery</th>
              <th className="px-4 py-3 font-medium">Connectivity</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7}>
                <EmptyState
                  icon={Watch}
                  title="Band inventory will load from the API"
                  description="Inventory table showing band ID, assigned patient, battery level, connectivity status, and device health. Assign and reclaim flows, faulty device reporting, and low-battery alerts will be available."
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
