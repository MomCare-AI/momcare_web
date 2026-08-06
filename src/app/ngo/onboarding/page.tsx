'use client'

import { Building2, CheckCircle2, Clock, FileText } from 'lucide-react'

const STEPS = [
  {
    number: 1,
    title: 'Organization Details',
    description: 'Legal name, registration number, incorporation date',
    icon: Building2,
  },
  {
    number: 2,
    title: 'Service Area & Resources',
    description: 'Region, ambulances, nurses, field workers',
    icon: FileText,
  },
  {
    number: 3,
    title: 'Document Upload',
    description: 'Registration certificate, operational license',
    icon: FileText,
  },
]

export default function NgoOnboarding() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-pine">NGO Onboarding</h1>
        <p className="text-sm text-ink-muted">
          Register your organization to coordinate maternal care in your area.
        </p>
      </div>

      {/* Status banner */}
      <div className="flex items-center gap-3 rounded-[10px] border border-line bg-pine-wash/50 p-4">
        <Clock size={18} className="text-pine" />
        <div>
          <p className="text-sm font-medium text-pine">Onboarding status: Not started</p>
          <p className="text-xs text-ink-muted">
            Complete all three steps below, then submit for admin approval. Status flow: Submitted →
            Under Review → Approved
          </p>
        </div>
      </div>

      {/* Step cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.number} className="rounded-[10px] border border-line bg-panel p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pine-wash">
                <span className="font-display text-sm font-semibold text-pine">{step.number}</span>
              </div>
              <h3 className="text-sm font-semibold text-pine">{step.title}</h3>
            </div>
            <p className="mb-4 text-xs text-ink-muted">{step.description}</p>
            <button
              disabled
              className="rounded-lg bg-pine px-3 py-1.5 text-xs font-medium text-surface opacity-50"
            >
              Start step {step.number}
            </button>
            <p className="mt-2 text-[10px] text-ink-muted">Form not yet built</p>
          </div>
        ))}
      </div>

      {/* Safety disclaimer — per BRIEF.md §0 */}
      <div className="rounded-[10px] border border-[var(--color-marigold)]/30 bg-[var(--color-marigold)]/5 p-4">
        <p className="text-xs font-medium text-[var(--color-marigold)]">
          Safety Disclaimer Requirement
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          When registering mothers who do not have a smartphone, the onboarding flow must include an
          explicit, unskippable acknowledgment that MomCare is not an emergency service, is not
          monitored 24/7, and that a suspected emergency means calling Rescue 1122 or going to the
          nearest hospital immediately.
        </p>
      </div>
    </div>
  )
}
