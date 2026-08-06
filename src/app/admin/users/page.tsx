'use client'

import { useState } from 'react'
import { UsersRound, Stethoscope, Building2, Users } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

type TabKey = 'patients' | 'doctors' | 'ngos'

const TABS: { key: TabKey; label: string; icon: typeof Users }[] = [
  { key: 'patients', label: 'Patients', icon: Users },
  { key: 'doctors', label: 'Doctors', icon: Stethoscope },
  { key: 'ngos', label: 'NGOs', icon: Building2 },
]

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<TabKey>('patients')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-pine">
          User Management
        </h1>
        <p className="text-sm text-ink-muted">
          Approve, suspend, and audit users across the platform.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
              activeTab === tab.key
                ? 'text-pine'
                : 'text-ink-muted hover:text-pine'
            }`}
            role="tab"
            aria-selected={activeTab === tab.key}
          >
            <tab.icon size={15} aria-hidden />
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-pine" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-[10px] border border-line bg-panel" role="tabpanel">
        {activeTab === 'patients' && (
          <EmptyState
            icon={Users}
            title="Patient registry will load from the API"
            description="View all registered mothers, their assigned doctors and NGOs, and account status. Approve, suspend, or reactivate accounts."
          />
        )}
        {activeTab === 'doctors' && (
          <EmptyState
            icon={Stethoscope}
            title="Doctor registry will load from the API"
            description="Doctor approval requires license verification — the uploaded credential will be visible in the approval dialog before you can approve."
          />
        )}
        {activeTab === 'ngos' && (
          <EmptyState
            icon={Building2}
            title="NGO registry will load from the API"
            description="Review onboarding submissions, verify registration documents, and approve or reject organizations."
          />
        )}
      </div>
    </div>
  )
}
