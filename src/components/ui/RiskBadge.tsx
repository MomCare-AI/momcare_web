'use client'

import { AlertTriangle, TrendingUp, ShieldCheck, Minus } from 'lucide-react'

type RiskLevel = 'high' | 'medium' | 'low' | 'none'

const CONFIG: Record<
  RiskLevel,
  { label: string; icon: typeof AlertTriangle; bg: string; text: string; border: string }
> = {
  high: {
    label: 'High Risk',
    icon: AlertTriangle,
    bg: 'bg-[var(--color-clay)]/10',
    text: 'text-[var(--color-clay)]',
    border: 'border-[var(--color-clay)]/20',
  },
  medium: {
    label: 'Medium Risk',
    icon: TrendingUp,
    bg: 'bg-[var(--color-marigold)]/10',
    text: 'text-[var(--color-marigold)]',
    border: 'border-[var(--color-marigold)]/20',
  },
  low: {
    label: 'Low Risk',
    icon: ShieldCheck,
    bg: 'bg-[var(--color-sage)]/10',
    text: 'text-[var(--color-sage)]',
    border: 'border-[var(--color-sage)]/20',
  },
  none: {
    label: 'No Data',
    icon: Minus,
    bg: 'bg-[var(--color-slate)]/10',
    text: 'text-[var(--color-slate)]',
    border: 'border-[var(--color-slate)]/20',
  },
}

export default function RiskBadge({
  level,
  className = '',
}: {
  level: RiskLevel
  className?: string
}) {
  const { label, icon: Icon, bg, text, border } = CONFIG[level]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${bg} ${text} ${border} ${className}`}
      role="status"
      aria-label={`Risk level: ${label}`}
    >
      <Icon size={12} aria-hidden />
      {label}
    </span>
  )
}
