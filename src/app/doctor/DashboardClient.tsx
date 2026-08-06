'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Activity,
  Droplets,
  HeartPulse,
  AlertCircle,
  Check,
  Wifi,
  WifiOff,
  CalendarClock,
} from 'lucide-react'
import { useAcknowledgeAlert } from '@/lib/hooks/useAcknowledgeAlert'
import StatCard from '@/components/ui/StatCard'
import FilterChip from '@/components/ui/FilterChip'
import RiskBadge from '@/components/ui/RiskBadge'
import DataFreshness from '@/components/ui/DataFreshness'
import EmptyState from '@/components/ui/EmptyState'
import type { Alert } from '@/lib/types'

// Using the seeded patient ID from kickoff doc
const DEMO_PATIENT_ID = 'd63b9af2-8eb4-479d-929c-f17819e058e7'

// Mock roster data — in production this comes from GET /api/patients
const MOCK_PATIENTS = [
  {
    id: DEMO_PATIENT_ID,
    name: 'Fatima Malik',
    gestationalAge: '32w 4d',
    risk: 'high' as const,
    bandStatus: 'connected' as const,
  },
  {
    id: '2a8c65f1-1111-4aaa-bbbb-000000000001',
    name: 'Amina Bibi',
    gestationalAge: '28w 1d',
    risk: 'medium' as const,
    bandStatus: 'connected' as const,
  },
  {
    id: '2a8c65f1-2222-4aaa-bbbb-000000000002',
    name: 'Nadia Hussain',
    gestationalAge: '36w 6d',
    risk: 'low' as const,
    bandStatus: 'disconnected' as const,
  },
]

type FilterKey = 'all' | 'high' | 'pending' | 'lab'

export default function DashboardClient() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const { data: alerts, isLoading: loadingAlerts } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await fetch('/api/alerts')
      if (!res.ok) throw new Error('Failed to fetch alerts')
      return res.json()
    },
    refetchInterval: 10000,
  })

  const acknowledgeMutation = useAcknowledgeAlert(['alerts'])

  const { data: latestVitals, isLoading: loadingVitals } = useQuery({
    queryKey: ['latestVitals', DEMO_PATIENT_ID],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${DEMO_PATIENT_ID}/vitals/latest`)
      if (!res.ok) throw new Error('Failed to fetch vitals')
      return res.json()
    },
    refetchInterval: 10000,
  })

  const pendingAlerts = alerts?.filter((a) => a.status === 'pending') ?? []

  // Filter roster based on active chip
  const filteredPatients = MOCK_PATIENTS.filter((p) => {
    if (activeFilter === 'high') return p.risk === 'high'
    if (activeFilter === 'pending') {
      return pendingAlerts.some((a) => a.patient_id === p.id)
    }
    return true // 'all' and 'lab' show all for now
  })
    // High risk always sorts to top regardless of user sort (BRIEF.md §4.1)
    .sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2, none: 3 }
      return riskOrder[a.risk] - riskOrder[b.risk]
    })

  const filters: { key: FilterKey; label: string; count: number; tooltip: string }[] = [
    {
      key: 'all',
      label: 'All Patients',
      count: MOCK_PATIENTS.length,
      tooltip: 'All patients currently assigned to you',
    },
    {
      key: 'high',
      label: 'High Risk',
      count: MOCK_PATIENTS.filter((p) => p.risk === 'high').length,
      tooltip: 'Patients classified as high risk by the AI risk model',
    },
    {
      key: 'pending',
      label: 'Pending Alerts',
      count: pendingAlerts.length,
      tooltip: 'Patients with unacknowledged critical alerts',
    },
    {
      key: 'lab',
      label: 'Lab Verification',
      count: 0,
      tooltip: 'Patients with lab reports awaiting your verification',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-pine">Dashboard</h1>
        <p className="text-sm text-ink-muted">Overview of your patients and alerts.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Patients"
          value={MOCK_PATIENTS.length}
          icon={HeartPulse}
          href="/doctor/patients"
        />
        <StatCard
          label="High Risk"
          value={MOCK_PATIENTS.filter((p) => p.risk === 'high').length}
          variant="danger"
          icon={AlertCircle}
        />
        <StatCard
          label="Pending Lab Verifications"
          value={0}
          icon={Activity}
          subtitle="No reports awaiting review"
        />
        <StatCard
          label="Today's Appointments"
          value="—"
          icon={CalendarClock}
          subtitle="Not yet configured"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Patient Roster */}
        <div className="col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-pine">Patient Roster</h2>
            <button
              onClick={() => router.push('/doctor/patients/new')}
              className="flex items-center gap-1.5 rounded-lg bg-pine px-3 py-1.5 text-sm font-medium text-surface transition-colors hover:bg-[var(--color-pine-deep)]"
            >
              + Register Patient
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <FilterChip
                key={f.key}
                label={f.label}
                count={f.count}
                active={activeFilter === f.key}
                onClick={() => setActiveFilter(f.key)}
                tooltip={f.tooltip}
              />
            ))}
          </div>

          <div className="overflow-hidden rounded-[10px] border border-line bg-panel">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-pine-wash text-pine">
                <tr>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Risk Level</th>
                  <th className="px-4 py-3 font-medium">Latest Vitals</th>
                  <th className="px-4 py-3 font-medium">Last Reading</th>
                  <th className="px-4 py-3 font-medium">Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        title="No patients match this filter"
                        description="Try a different filter or check back when new readings arrive."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      onClick={() => router.push(`/doctor/patients/${patient.id}`)}
                      className="cursor-pointer transition-colors duration-150 hover:bg-pine-wash/40"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-pine">{patient.name}</p>
                        <p className="text-xs text-ink-muted">{patient.gestationalAge}</p>
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge level={patient.risk} />
                      </td>
                      <td className="px-4 py-3">
                        {patient.id === DEMO_PATIENT_ID ? (
                          loadingVitals ? (
                            <span className="text-xs text-ink-muted">Loading…</span>
                          ) : latestVitals ? (
                            <div className="flex gap-3 font-data text-xs">
                              <span className="flex items-center gap-1" title="Blood Pressure">
                                <HeartPulse size={12} className="text-[var(--color-clay)]" />
                                {latestVitals.systolic_bp ?? '—'}/{latestVitals.diastolic_bp ?? '—'}
                              </span>
                              <span className="flex items-center gap-1" title="Heart Rate">
                                <Activity size={12} className="text-[var(--color-marigold)]" />
                                {latestVitals.heart_rate ?? '—'}
                              </span>
                              <span className="flex items-center gap-1" title="SpO2">
                                <Droplets size={12} className="text-[var(--color-sage)]" />
                                {latestVitals.spo2 != null ? `${latestVitals.spo2}%` : '—'}
                              </span>
                            </div>
                          ) : (
                            <span className="font-data text-xs text-ink-muted">—</span>
                          )
                        ) : (
                          <span className="font-data text-xs text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <DataFreshness
                          timestamp={
                            patient.id === DEMO_PATIENT_ID ? latestVitals?.recorded_at : null
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        {patient.bandStatus === 'connected' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-sage)]">
                            <Wifi size={12} aria-hidden />
                            Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-marigold)]">
                            <WifiOff size={12} aria-hidden />
                            Offline
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alert Feed */}
        <div className="col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-pine">
              <AlertCircle size={18} className="text-[var(--color-clay)]" />
              High-Risk Alerts
            </h2>
            <span className="text-[10px] uppercase tracking-wide text-ink-muted">Live</span>
          </div>

          <div className="flex min-h-[400px] flex-col gap-3 rounded-[10px] border border-line bg-panel p-4">
            {loadingAlerts ? (
              <EmptyState title="Loading alerts…" description="Checking for critical readings." />
            ) : alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-[10px] border p-3 transition-colors duration-150 ${
                    alert.status === 'pending'
                      ? 'border-[var(--color-clay)]/20 bg-[var(--color-clay)]/5'
                      : 'border-line bg-panel opacity-70'
                  }`}
                >
                  <div className="mb-1 flex items-start justify-between">
                    <p
                      className={`text-sm font-medium ${
                        alert.status === 'pending' ? 'text-[var(--color-clay)]' : 'text-ink-muted'
                      }`}
                    >
                      {alert.alert_type.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <span className="font-data text-[10px] text-ink-muted">
                      {new Date(alert.triggered_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mb-2 text-xs text-ink">Fatima Malik • {alert.reading_summary}</p>

                  {alert.status === 'pending' ? (
                    <button
                      onClick={() => acknowledgeMutation.mutate(alert.id)}
                      disabled={acknowledgeMutation.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-[var(--color-clay)] px-3 py-1.5 text-xs font-medium text-surface transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
                    >
                      <Check size={12} />
                      {acknowledgeMutation.isPending && acknowledgeMutation.variables === alert.id
                        ? 'Acknowledging…'
                        : 'Acknowledge'}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-sage)]">
                      <Check size={12} /> Acknowledged
                    </span>
                  )}
                </div>
              ))
            ) : (
              <EmptyState
                icon={AlertCircle}
                title="No active alerts"
                description="Patient activity will appear here once readings are recorded."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
