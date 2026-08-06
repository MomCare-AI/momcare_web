'use client'

import { Clock, AlertTriangle } from 'lucide-react'

/** Minutes after which a reading is considered stale */
const STALE_THRESHOLD_MINUTES = 30

function formatRelativeTime(isoTimestamp: string): { text: string; isStale: boolean } {
  const now = Date.now()
  const then = new Date(isoTimestamp).getTime()
  const diffMs = now - then

  if (isNaN(then)) {
    return { text: 'Unknown', isStale: true }
  }

  const minutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const isStale = minutes >= STALE_THRESHOLD_MINUTES

  if (minutes < 1) return { text: 'Just now', isStale: false }
  if (minutes < 60) return { text: `${minutes} min ago`, isStale }
  if (hours < 24) return { text: `${hours}h ago`, isStale }
  return { text: `${days}d ago`, isStale }
}

export default function DataFreshness({
  timestamp,
  className = '',
}: {
  timestamp: string | null | undefined
  className?: string
}) {
  if (!timestamp) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs text-ink-muted ${className}`}
        title="No reading recorded"
      >
        <Clock size={12} aria-hidden />
        <span className="font-data">—</span>
      </span>
    )
  }

  const { text, isStale } = formatRelativeTime(timestamp)

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${
        isStale ? 'text-[var(--color-marigold)]' : 'text-ink-muted'
      } ${className}`}
      title={`Last reading: ${new Date(timestamp).toLocaleString()}`}
    >
      {isStale ? (
        <AlertTriangle size={12} aria-hidden />
      ) : (
        <Clock size={12} aria-hidden />
      )}
      <span className="font-data">{text}</span>
    </span>
  )
}
