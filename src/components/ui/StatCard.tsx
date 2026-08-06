'use client'

import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'

type Variant = 'default' | 'danger' | 'warning' | 'success'

const VARIANT_STYLES: Record<Variant, { card: string; label: string; value: string }> = {
  default: {
    card: 'bg-panel border-line',
    label: 'text-ink-muted',
    value: 'text-pine',
  },
  danger: {
    card: 'bg-[var(--color-clay)]/5 border-[var(--color-clay)]/20',
    label: 'text-[var(--color-clay)]',
    value: 'text-[var(--color-clay)]',
  },
  warning: {
    card: 'bg-[var(--color-marigold)]/5 border-[var(--color-marigold)]/20',
    label: 'text-[var(--color-marigold)]',
    value: 'text-[var(--color-marigold)]',
  },
  success: {
    card: 'bg-[var(--color-sage)]/5 border-[var(--color-sage)]/20',
    label: 'text-[var(--color-sage)]',
    value: 'text-[var(--color-sage)]',
  },
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  href,
  variant = 'default',
  subtitle,
}: {
  label: string
  value: string | number
  icon?: LucideIcon
  href?: string
  variant?: Variant
  subtitle?: string
}) {
  const styles = VARIANT_STYLES[variant]

  const content = (
    <div
      className={`rounded-[10px] border p-4 transition-colors duration-150 ${styles.card} ${
        href ? 'hover:border-pine/40 cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${styles.label}`}>{label}</p>
        {Icon && <Icon size={16} className={styles.label} aria-hidden />}
      </div>
      <p className={`mt-2 font-display text-3xl font-semibold tabular-nums ${styles.value}`}>
        {value}
      </p>
      {subtitle && <p className="mt-1 text-xs text-ink-muted">{subtitle}</p>}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
