'use client'

import { Users, AlertTriangle, Wifi, Siren, Watch, MapPin } from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import RiskBadge from '@/components/ui/RiskBadge'
import EmptyState from '@/components/ui/EmptyState'

// Mock data — will come from API endpoints once built
const ZONE_SUMMARY = {
  zone: 'Zone 4 — Orangi Town, Karachi',
  totalPatients: 47,
  highRisk: 8,
  bandConnectivity: 82,
  openEmergencies: 1,
}

const RECENT_PATIENTS = [
  {
    id: '1',
    name: 'Fatima Malik',
    zone: 'Orangi Town',
    risk: 'high' as const,
    bandStatus: 'connected',
  },
  {
    id: '2',
    name: 'Amina Bibi',
    zone: 'Orangi Town',
    risk: 'medium' as const,
    bandStatus: 'connected',
  },
  {
    id: '3',
    name: 'Nadia Hussain',
    zone: 'Lyari',
    risk: 'low' as const,
    bandStatus: 'disconnected',
  },
  {
    id: '4',
    name: 'Sana Qureshi',
    zone: 'Orangi Town',
    risk: 'high' as const,
    bandStatus: 'connected',
  },
]

export default function NgoDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-pine">NGO Dashboard</h1>
        <p className="text-sm text-ink-muted">{ZONE_SUMMARY.zone}</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Patients"
          value={ZONE_SUMMARY.totalPatients}
          icon={Users}
          href="/ngo/patients"
        />
        <StatCard
          label="High Risk"
          value={ZONE_SUMMARY.highRisk}
          variant="danger"
          icon={AlertTriangle}
        />
        <StatCard
          label="Band Connectivity"
          value={`${ZONE_SUMMARY.bandConnectivity}%`}
          icon={Wifi}
          href="/ngo/bands"
          subtitle={`${Math.round((ZONE_SUMMARY.totalPatients * ZONE_SUMMARY.bandConnectivity) / 100)} bands online`}
        />
        <StatCard
          label="Open Emergencies"
          value={ZONE_SUMMARY.openEmergencies}
          variant={ZONE_SUMMARY.openEmergencies > 0 ? 'danger' : 'default'}
          icon={Siren}
          href="/ngo/emergency"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Patient summary */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-pine">Recent Patients</h2>
            <a href="/ngo/patients" className="text-xs font-medium text-pine hover:underline">
              View all →
            </a>
          </div>

          <div className="overflow-hidden rounded-[10px] border border-line bg-panel">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-pine-wash text-pine">
                <tr>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Zone</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 font-medium">Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {RECENT_PATIENTS.map((p) => (
                  <tr key={p.id} className="transition-colors duration-150 hover:bg-pine-wash/40">
                    <td className="px-4 py-3 font-medium text-pine">{p.name}</td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} aria-hidden />
                        {p.zone}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={p.risk} />
                    </td>
                    <td className="px-4 py-3">
                      {p.bandStatus === 'connected' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--color-sage)]">
                          <Wifi size={12} aria-hidden />
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--color-marigold)]">
                          <Wifi size={12} aria-hidden />
                          Offline
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Band inventory summary */}
        <div className="col-span-1 space-y-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-pine">
            <Watch size={18} aria-hidden />
            Band Inventory
          </h2>

          <div className="rounded-[10px] border border-line bg-panel p-4 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Total bands</span>
              <span className="font-data font-medium text-pine">52</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Assigned</span>
              <span className="font-data font-medium text-pine">47</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Available</span>
              <span className="font-data font-medium text-[var(--color-sage)]">5</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Faulty / recalled</span>
              <span className="font-data font-medium text-[var(--color-marigold)]">0</span>
            </div>

            <div className="border-t border-line pt-3">
              <a href="/ngo/bands" className="text-xs font-medium text-pine hover:underline">
                Manage inventory →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
