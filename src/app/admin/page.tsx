'use client'

import {
  Users,
  Stethoscope,
  Building2,
  TrendingUp,
  Server,
  ShieldCheck,
  Activity,
  MessageSquare,
  Radio,
} from 'lucide-react'
import StatCard from '@/components/ui/StatCard'

// Mock platform stats — will come from admin API endpoints
const PLATFORM_STATS = {
  totalPatients: 312,
  totalDoctors: 18,
  totalNgos: 7,
  activeToday: 89,
}

const SERVICES = [
  { name: 'FastAPI Backend', status: 'operational' as const, uptime: '99.8%', icon: Server },
  { name: 'OCR Engine', status: 'operational' as const, uptime: '99.2%', icon: Activity },
  { name: 'Supabase Auth', status: 'operational' as const, uptime: '99.9%', icon: ShieldCheck },
  { name: 'SMS Gateway', status: 'degraded' as const, uptime: '97.1%', icon: MessageSquare },
  { name: 'MQTT Broker', status: 'operational' as const, uptime: '99.7%', icon: Radio },
]

const RECENT_ACTIVITY = [
  { action: 'Doctor approved', detail: 'Dr. Hassan Ali — license verified', time: '12 min ago' },
  { action: 'Threshold updated', detail: 'Systolic BP high threshold → 140 mmHg', time: '1h ago' },
  { action: 'NGO registered', detail: 'Edhi Foundation — pending review', time: '3h ago' },
  { action: 'Alert escalated', detail: 'Patient Fatima Malik — unacknowledged for 30 min', time: '5h ago' },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-pine">
          Admin Console
        </h1>
        <p className="text-sm text-ink-muted">
          Platform oversight, user governance, and system health.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Patients"
          value={PLATFORM_STATS.totalPatients}
          icon={Users}
          href="/admin/users"
        />
        <StatCard
          label="Registered Doctors"
          value={PLATFORM_STATS.totalDoctors}
          icon={Stethoscope}
          href="/admin/users"
        />
        <StatCard
          label="Active NGOs"
          value={PLATFORM_STATS.totalNgos}
          icon={Building2}
          href="/admin/users"
        />
        <StatCard
          label="Active Today"
          value={PLATFORM_STATS.activeToday}
          variant="success"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Service Health Cards */}
        <div className="col-span-2 space-y-4">
          <h2 className="font-display text-lg font-semibold text-pine">
            Service Health
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((svc) => (
              <div
                key={svc.name}
                className="rounded-[10px] border border-line bg-panel p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <svc.icon size={16} className="text-ink-muted" aria-hidden />
                  <span className="text-sm font-medium text-ink">{svc.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                      svc.status === 'operational'
                        ? 'bg-[var(--color-sage)]/10 text-[var(--color-sage)]'
                        : 'bg-[var(--color-marigold)]/10 text-[var(--color-marigold)]'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        svc.status === 'operational'
                          ? 'bg-[var(--color-sage)]'
                          : 'bg-[var(--color-marigold)]'
                      }`}
                    />
                    {svc.status}
                  </span>
                  <span className="font-data text-xs text-ink-muted">{svc.uptime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-1 space-y-4">
          <h2 className="font-display text-lg font-semibold text-pine">
            Recent Activity
          </h2>
          <div className="flex flex-col gap-3 rounded-[10px] border border-line bg-panel p-4">
            {RECENT_ACTIVITY.map((item, i) => (
              <div
                key={i}
                className={`${
                  i < RECENT_ACTIVITY.length - 1
                    ? 'border-b border-line pb-3'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-ink">{item.action}</p>
                  <span className="font-data text-[10px] text-ink-muted whitespace-nowrap ml-2">
                    {item.time}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
