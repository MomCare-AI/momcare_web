'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Activity,
  HeartPulse,
  Droplets,
  Thermometer,
  Wifi,
  WifiOff,
  StickyNote,
  Plus,
} from 'lucide-react'
import { useAcknowledgeAlert } from '@/lib/hooks/useAcknowledgeAlert'
import RiskBadge from '@/components/ui/RiskBadge'
import DataFreshness from '@/components/ui/DataFreshness'
import PatientSettingsForm from '@/components/clinical/PatientSettingsForm'
import EmptyState from '@/components/ui/EmptyState'
import VitalsRibbon from '@/components/clinical/VitalsRibbon'
import type { Alert, Patient, VitalReading } from '@/lib/types'

// Demographic fields aren't backed by an API yet - there's no GET
// /patients/{id} endpoint, only vitals and alerts scoped by patient_id.
// Hardcoded here on purpose (same pattern as the dashboard's roster row)
// rather than faking a fetch for data that doesn't exist server-side yet.
const PATIENT_NAME = 'Fatima Malik'
const GESTATIONAL_AGE = '32w 4d'
const EDD = '2026-10-15'
const AGE = 28
const ASSIGNED_NGO = 'Edhi Foundation'

// Mock roster for prev/next navigation — in production, this would come
// from a shared query or context that mirrors the dashboard roster.
const ROSTER_IDS = [
  'd63b9af2-8eb4-479d-929c-f17819e058e7',
  '2a8c65f1-1111-4aaa-bbbb-000000000001',
  '2a8c65f1-2222-4aaa-bbbb-000000000002',
]

type TabKey =
  | 'details'
  | 'settings'
  | 'monitoring_time'
  | 'devices'
  | 'patient_documents'
  | 'instructional_videos'
  | 'vitals'
  | 'alerts'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'settings', label: 'Settings' },
  { key: 'monitoring_time', label: 'Monitoring Time' },
  { key: 'devices', label: 'Devices' },
  { key: 'patient_documents', label: 'Patient Documents' },
  { key: 'instructional_videos', label: 'Instructional Videos' },
  { key: 'vitals', label: 'Vitals History' },
  { key: 'alerts', label: 'Alerts History' },
]

type LocalNote = {
  id: string
  type: string
  content: string
  author: string
  createdAt: string
}

export default function PatientDetailClient({ patientId }: { patientId: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('details')
  const [notes, setNotes] = useState<LocalNote[]>([])
  const [noteType, setNoteType] = useState('general')
  const [noteContent, setNoteContent] = useState('')
  const [showNoteForm, setShowNoteForm] = useState(false)

  // Prev/next patient navigation
  const currentIndex = ROSTER_IDS.indexOf(patientId)
  const prevId = currentIndex > 0 ? ROSTER_IDS[currentIndex - 1] : null
  const nextId = currentIndex < ROSTER_IDS.length - 1 ? ROSTER_IDS[currentIndex + 1] : null

  // Fetch patient details
  const { data: patient, isLoading: loadingPatient } = useQuery<Patient>({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}`)
      if (!res.ok) throw new Error('Failed to fetch patient details')
      return res.json()
    },
  })

  const { data: vitals, isLoading: loadingVitals } = useQuery<VitalReading[]>({
    queryKey: ['vitalsHistory', patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/vitals?limit=20`)
      if (!res.ok) throw new Error('Failed to fetch vitals history')
      return res.json()
    },
    refetchInterval: 10000,
  })

  const { data: alerts, isLoading: loadingAlerts } = useQuery<Alert[]>({
    queryKey: ['patientAlerts', patientId],
    queryFn: async () => {
      const res = await fetch(`/api/alerts?patient_id=${patientId}`)
      if (!res.ok) throw new Error('Failed to fetch alerts')
      return res.json()
    },
    refetchInterval: 10000,
  })

  const acknowledgeMutation = useAcknowledgeAlert(['patientAlerts', patientId])

  const latestVital = vitals?.[0]
  const pendingAlerts = alerts?.filter((a) => a.status === 'pending') ?? []

  function handleAddNote() {
    if (!noteContent.trim()) return
    const newNote: LocalNote = {
      id: crypto.randomUUID(),
      type: noteType,
      content: noteContent.trim(),
      author: 'Dr. Ayesha Raza', // Will come from session in production
      createdAt: new Date().toISOString(),
    }
    setNotes((prev) => [newNote, ...prev])
    setNoteContent('')
    setShowNoteForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Back + prev/next navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/doctor')}
          className="flex items-center gap-1.5 text-sm text-ink-muted transition-colors duration-150 hover:text-pine"
        >
          <ArrowLeft size={15} />
          Back to roster
        </button>

        {/* Prev / Next patient (TOCA finding) */}
        <div className="flex items-center gap-2">
          <span className="font-data text-xs text-ink-muted">
            Patient {currentIndex + 1}/{ROSTER_IDS.length}
          </span>
          <button
            onClick={() => prevId && router.push(`/doctor/patients/${prevId}`)}
            disabled={!prevId}
            className="rounded-lg border border-line p-1.5 text-ink-muted transition-colors duration-150 hover:border-pine/40 hover:text-pine disabled:opacity-30"
            aria-label="Previous patient"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => nextId && router.push(`/doctor/patients/${nextId}`)}
            disabled={!nextId}
            className="rounded-lg border border-line p-1.5 text-ink-muted transition-colors duration-150 hover:border-pine/40 hover:text-pine disabled:opacity-30"
            aria-label="Next patient"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Patient header */}
      <div className="rounded-[10px] border border-line bg-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-3">
              <h1 className="font-display text-2xl font-semibold text-pine">
                {loadingPatient ? 'Loading...' : patient?.user?.full_name || 'Unknown Patient'}
              </h1>
              <RiskBadge level="high" />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
              {loadingPatient ? (
                <span>Loading details...</span>
              ) : (
                <>
                  <span>Age {patient?.age || '—'}</span>
                  <span>{patient?.gestational_week ? `${patient.gestational_week}w` : '—'}</span>
                  <span>EDD: {patient?.due_date || '—'}</span>
                  <span>NGO: {ASSIGNED_NGO}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-xs text-[var(--color-sage)]">
                <Wifi size={12} aria-hidden />
                Band connected
              </span>
              <div className="mt-0.5">
                <DataFreshness timestamp={latestVital?.recorded_at} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick vital summary row */}
        {latestVital && (
          <div className="mt-4 flex flex-wrap gap-6 border-t border-line pt-4">
            <div className="flex items-center gap-2">
              <HeartPulse size={14} className="text-[var(--color-clay)]" aria-hidden />
              <span className="text-xs text-ink-muted">BP</span>
              <span className="font-data text-sm font-medium">
                {latestVital.systolic_bp ?? '—'}/{latestVital.diastolic_bp ?? '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[var(--color-marigold)]" aria-hidden />
              <span className="text-xs text-ink-muted">HR</span>
              <span className="font-data text-sm font-medium">{latestVital.heart_rate ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets size={14} className="text-[var(--color-sage)]" aria-hidden />
              <span className="text-xs text-ink-muted">SpO₂</span>
              <span className="font-data text-sm font-medium">
                {latestVital.spo2 != null ? `${latestVital.spo2}%` : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer size={14} className="text-[var(--color-slate)]" aria-hidden />
              <span className="text-xs text-ink-muted">Temp</span>
              <span className="font-data text-sm font-medium">
                {latestVital.temperature != null ? `${latestVital.temperature}°C` : '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Vitals Ribbon Signature Component */}
      <VitalsRibbon />

      {/* Sub-tabs (TOCA Style Pills) */}
      <div className="flex flex-wrap gap-3 mb-6">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                isActive
                  ? 'bg-pine text-surface shadow-md'
                  : 'bg-pine-wash/50 text-pine hover:bg-pine-wash'
              }`}
              aria-selected={isActive}
              role="tab"
            >
              {tab.label}
              {tab.key === 'alerts' && pendingAlerts.length > 0 && (
                <span
                  className={`ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${isActive ? 'bg-surface text-pine' : 'bg-[var(--color-clay)] text-surface'}`}
                >
                  {pendingAlerts.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Real Patient Data Overview */}
            <div className="col-span-2 space-y-6">
              <div className="rounded-[10px] border border-line bg-panel p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-lg font-semibold text-pine">
                    Basic Patient Information
                  </h2>
                </div>

                {loadingPatient ? (
                  <p className="text-sm text-ink-muted">Loading patient details...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
                    <div>
                      <span className="block text-xs text-ink-muted mb-1">Patient Name :</span>
                      <span className="font-medium text-ink">
                        {patient?.user?.full_name || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-ink-muted mb-1">Provider :</span>
                      <span className="font-medium text-ink">{patient?.provider_name || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-ink-muted mb-1">Date of Birth :</span>
                      <span className="font-medium text-ink">
                        {patient?.due_date ? new Date(patient.due_date).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-ink-muted mb-1">Case Manager :</span>
                      <span className="font-medium text-ink">{patient?.nurse_name || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-ink-muted mb-1">Gender :</span>
                      <span className="font-medium text-ink">Female</span>
                    </div>
                    <div>
                      <span className="block text-xs text-ink-muted mb-1">Days of readings :</span>
                      <span className="font-medium text-ink">{vitals?.length || 0}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-ink-muted mb-1">Primary Phone :</span>
                      <span className="font-medium text-ink">
                        {patient?.user?.phone_number || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-ink-muted mb-1">
                        Preferred Language :
                      </span>
                      <span className="font-medium text-ink">Urdu / English</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-xs text-ink-muted mb-1">Email :</span>
                      <span className="font-medium text-ink">{patient?.user?.email || '—'}</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Recent vitals summary */}
              <div className="col-span-2 space-y-4">
                <h2 className="font-display text-base font-semibold text-pine">Recent Readings</h2>
                <div className="overflow-hidden rounded-[10px] border border-line bg-panel">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-line bg-pine-wash text-pine">
                      <tr>
                        <th className="px-4 py-3 font-medium">Recorded</th>
                        <th className="px-4 py-3 font-medium">BP</th>
                        <th className="px-4 py-3 font-medium">HR</th>
                        <th className="px-4 py-3 font-medium">SpO₂</th>
                        <th className="px-4 py-3 font-medium">Temp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {loadingVitals ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-xs text-ink-muted">
                            Loading vitals…
                          </td>
                        </tr>
                      ) : vitals && vitals.length > 0 ? (
                        vitals.slice(0, 5).map((v) => (
                          <tr key={v.id}>
                            <td className="px-4 py-2.5 font-data text-xs text-ink-muted">
                              {new Date(v.recorded_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 font-data text-xs">
                              {v.systolic_bp ?? '—'}/{v.diastolic_bp ?? '—'}
                            </td>
                            <td className="px-4 py-2.5 font-data text-xs">{v.heart_rate ?? '—'}</td>
                            <td className="px-4 py-2.5 font-data text-xs">
                              {v.spo2 != null ? `${v.spo2}%` : '—'}
                            </td>
                            <td className="px-4 py-2.5 font-data text-xs">
                              {v.temperature != null ? `${v.temperature}°C` : '—'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5}>
                            <EmptyState
                              title="No readings yet"
                              description="Vital signs will appear here once the health band starts transmitting."
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Clinical Notes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-display text-base font-semibold text-pine">
                      <StickyNote size={16} aria-hidden />
                      Clinical Notes
                    </h2>
                    <button
                      onClick={() => setShowNoteForm((v) => !v)}
                      className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors duration-150 hover:border-pine/40 hover:text-pine"
                    >
                      <Plus size={12} />
                      Add note
                    </button>
                  </div>

                  {showNoteForm && (
                    <div className="rounded-[10px] border border-pine/20 bg-pine-wash/30 p-4 space-y-3">
                      <div className="flex gap-3">
                        <select
                          value={noteType}
                          onChange={(e) => setNoteType(e.target.value)}
                          className="rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs text-ink"
                        >
                          <option value="general">General</option>
                          <option value="clinical">Clinical Observation</option>
                          <option value="follow_up">Follow-up Required</option>
                          <option value="referral">Referral Note</option>
                        </select>
                      </div>
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Write a clinical note…"
                        rows={3}
                        className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-pine"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddNote}
                          disabled={!noteContent.trim()}
                          className="rounded-lg bg-pine px-3 py-1.5 text-xs font-medium text-surface transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
                        >
                          Save note
                        </button>
                        <button
                          onClick={() => {
                            setShowNoteForm(false)
                            setNoteContent('')
                          }}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors duration-150 hover:text-ink"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-[10px] text-ink-muted">
                        Note: saved locally only — backend storage not yet available.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {notes.length > 0 ? (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-[10px] border border-line bg-panel p-3"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span className="rounded bg-pine-wash px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-pine">
                              {note.type.replace(/_/g, ' ')}
                            </span>
                            <span className="font-data text-[10px] text-ink-muted">
                              {new Date(note.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-ink">{note.content}</p>
                          <p className="mt-1 text-xs text-ink-muted">— {note.author}</p>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        icon={StickyNote}
                        title="No clinical notes"
                        description="Add a note to record observations, follow-up requirements, or referral details."
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent alerts sidebar */}
            <div className="col-span-1 space-y-4">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-pine">
                <AlertCircle size={16} className="text-[var(--color-clay)]" />
                Recent Alerts
              </h2>
              <div className="flex flex-col gap-2">
                {loadingAlerts ? (
                  <EmptyState title="Loading alerts…" />
                ) : alerts && alerts.length > 0 ? (
                  alerts
                    .slice(0, 5)
                    .map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onAcknowledge={() => acknowledgeMutation.mutate(alert.id)}
                        isPending={
                          acknowledgeMutation.isPending &&
                          acknowledgeMutation.variables === alert.id
                        }
                      />
                    ))
                ) : (
                  <EmptyState
                    icon={AlertCircle}
                    title="No alerts"
                    description="Alerts will appear here when readings exceed thresholds."
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl">
            {loadingPatient ? (
              <EmptyState title="Loading settings…" />
            ) : patient ? (
              <PatientSettingsForm patient={patient} />
            ) : (
              <EmptyState title="Could not load patient settings" />
            )}
          </div>
        )}

        {activeTab === 'monitoring_time' && (
          <div className="max-w-4xl">
            <EmptyState
              title="Monitoring Time"
              description="Monitoring time logs will appear here."
            />
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="max-w-4xl space-y-6">
            <div className="rounded-[10px] border border-line bg-panel p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-semibold text-pine">Patient Devices</h2>
              </div>

              <div className="overflow-hidden rounded-[10px] border border-line">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line bg-pine-wash text-pine">
                    <tr>
                      <th className="px-4 py-3 font-medium">Device Id</th>
                      <th className="px-4 py-3 font-medium">Device Detail</th>
                      <th className="px-4 py-3 font-medium">Assigned Date</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line bg-surface">
                    <tr>
                      <td className="px-4 py-3 font-medium text-ink">BPM-2948</td>
                      <td className="px-4 py-3 text-ink-muted">Blood Pressure Monitor (RPM)</td>
                      <td className="px-4 py-3 font-data text-ink-muted">08/01/2026</td>
                      <td className="px-4 py-3 text-pine hover:underline cursor-pointer font-medium">
                        Unassign
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-ink">SPO2-1092</td>
                      <td className="px-4 py-3 text-ink-muted">Pulse Oximeter (RPM)</td>
                      <td className="px-4 py-3 font-data text-ink-muted">08/01/2026</td>
                      <td className="px-4 py-3 text-pine hover:underline cursor-pointer font-medium">
                        Unassign
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patient_documents' && (
          <div className="max-w-4xl">
            <EmptyState
              title="Patient Documents"
              description="Uploaded patient documents and lab reports will appear here."
            />
          </div>
        )}

        {activeTab === 'instructional_videos' && (
          <div className="max-w-4xl">
            <EmptyState
              title="Instructional Videos"
              description="Assigned instructional videos for this patient will appear here."
            />
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="overflow-hidden rounded-[10px] border border-line bg-panel">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-pine-wash text-pine">
                <tr>
                  <th className="px-4 py-3 font-medium">Recorded</th>
                  <th className="px-4 py-3 font-medium">BP</th>
                  <th className="px-4 py-3 font-medium">HR</th>
                  <th className="px-4 py-3 font-medium">SpO₂</th>
                  <th className="px-4 py-3 font-medium">Temp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loadingVitals ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-xs text-ink-muted">
                      Loading vitals…
                    </td>
                  </tr>
                ) : vitals && vitals.length > 0 ? (
                  vitals.map((v) => (
                    <tr key={v.id}>
                      <td className="px-4 py-2.5 font-data text-xs text-ink-muted">
                        {new Date(v.recorded_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 font-data text-xs">
                        {v.systolic_bp ?? '—'}/{v.diastolic_bp ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 font-data text-xs">{v.heart_rate ?? '—'}</td>
                      <td className="px-4 py-2.5 font-data text-xs">
                        {v.spo2 != null ? `${v.spo2}%` : '—'}
                      </td>
                      <td className="px-4 py-2.5 font-data text-xs">
                        {v.temperature != null ? `${v.temperature}°C` : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        title="No readings yet"
                        description="Vital signs will appear here once the health band starts transmitting."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {loadingAlerts ? (
              <EmptyState title="Loading alerts…" />
            ) : alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={() => acknowledgeMutation.mutate(alert.id)}
                  isPending={
                    acknowledgeMutation.isPending && acknowledgeMutation.variables === alert.id
                  }
                />
              ))
            ) : (
              <EmptyState
                icon={AlertCircle}
                title="No alerts for this patient"
                description="Alerts will appear here when readings exceed configured thresholds."
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Shared alert card used in overview sidebar and alerts tab */
function AlertCard({
  alert,
  onAcknowledge,
  isPending,
}: {
  alert: Alert
  onAcknowledge: () => void
  isPending: boolean
}) {
  return (
    <div
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
      <p className="mb-2 text-xs text-ink">{alert.reading_summary}</p>

      {alert.status === 'pending' ? (
        <button
          onClick={onAcknowledge}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-clay)] px-3 py-1.5 text-xs font-medium text-surface transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
        >
          <Check size={12} />
          {isPending ? 'Acknowledging…' : 'Acknowledge'}
        </button>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-sage)]">
          <Check size={12} /> Acknowledged
        </span>
      )}
    </div>
  )
}
