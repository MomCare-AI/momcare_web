'use client'

import { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'

export default function FilterChip({
  label,
  count,
  active,
  onClick,
  tooltip,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  tooltip?: string
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showTooltip) return
    function handleClickOutside(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setShowTooltip(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showTooltip])

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
          active
            ? 'border-pine bg-pine text-surface'
            : 'border-line bg-panel text-ink-muted hover:border-pine/40 hover:text-pine'
        }`}
        aria-pressed={active}
      >
        {label}
        <span
          className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums ${
            active ? 'bg-surface/20 text-surface' : 'bg-pine-wash text-pine'
          }`}
        >
          {count}
        </span>
      </button>

      {tooltip && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setShowTooltip((v) => !v)
          }}
          className="ml-0.5 text-ink-muted/60 hover:text-ink-muted"
          aria-label={`Info about ${label}`}
        >
          <Info size={12} />
        </button>
      )}

      {showTooltip && tooltip && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="absolute top-full left-0 z-50 mt-1.5 w-52 rounded-lg border border-line bg-panel p-2.5 text-xs text-ink-muted shadow-lg"
        >
          {tooltip}
        </div>
      )}
    </div>
  )
}
