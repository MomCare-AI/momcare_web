'use client'

import { useState } from 'react'
import {
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Check,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

type LabField = {
  id: string
  name: string
  extractedValue: string
  confidence: number
  referenceRange: string
  unit: string
  isCritical: boolean
}

const MOCK_FIELDS: LabField[] = [
  {
    id: 'hgb',
    name: 'Hemoglobin (Hgb)',
    extractedValue: '10.2',
    confidence: 0.98,
    referenceRange: '11.0 - 15.1',
    unit: 'g/dL',
    isCritical: true, // Low Hgb is anemic, common in pregnancy
  },
  {
    id: 'plt',
    name: 'Platelet Count',
    extractedValue: '142',
    confidence: 0.72, // Low confidence, requires touch
    referenceRange: '150 - 400',
    unit: 'x10^3/uL',
    isCritical: true,
  },
  {
    id: 'wbc',
    name: 'White Blood Cell Count',
    extractedValue: '8.5',
    confidence: 0.99,
    referenceRange: '4.5 - 11.0',
    unit: 'x10^3/uL',
    isCritical: false,
  },
]

export default function LabVerificationSplitView({ reportId }: { reportId: string }) {
  const router = useRouter()
  const [fields, setFields] = useState<LabField[]>(MOCK_FIELDS)
  const [verifiedState, setVerifiedState] = useState<Record<string, boolean>>({})
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  
  // A field is required to be "touched" if confidence is < 0.85
  const CONFIDENCE_THRESHOLD = 0.85

  const allVerified = fields.every((f) => verifiedState[f.id])

  function toggleVerification(id: string) {
    setVerifiedState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  function handleValueChange(id: string, newValue: string) {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, extractedValue: newValue } : f))
    )
  }

  function handleSubmit() {
    if (!allVerified) return
    // In production: send mutation to backend
    alert('Lab report verified and added to patient record.')
    router.push('/doctor')
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full flex-col lg:flex-row">
      {/* Left panel: Document Viewer */}
      <div className="flex flex-1 flex-col border-b border-line bg-surface lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-pine" />
            <h2 className="font-display text-sm font-semibold text-pine">
              Source Document
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="rounded p-1.5 text-ink-muted hover:bg-pine-wash hover:text-pine"
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="font-data text-xs text-ink-muted w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="rounded p-1.5 text-ink-muted hover:bg-pine-wash hover:text-pine"
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <div className="mx-2 h-4 w-px bg-line" />
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="rounded p-1.5 text-ink-muted hover:bg-pine-wash hover:text-pine"
              title="Rotate"
            >
              <RotateCw size={16} />
            </button>
          </div>
        </div>
        
        <div className="relative flex-1 overflow-auto bg-pine-wash/20 p-8">
          <div className="flex h-full min-h-[500px] w-full items-center justify-center">
            {/* Placeholder for the actual S3 document image */}
            <div
              className="flex h-[600px] w-[450px] flex-col items-center justify-center gap-4 border border-line bg-panel shadow-sm transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <FileText size={48} className="text-line" />
              <p className="text-sm font-medium text-ink-muted">
                [CBC Report Image Rendered Here]
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: Extracted Fields */}
      <div className="flex w-full flex-col bg-panel lg:w-[450px]">
        <div className="border-b border-line px-6 py-5">
          <h1 className="font-display text-xl font-semibold text-pine">
            Verify Extracted Data
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Compare AI-extracted values against the source document. You must verify every field.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {fields.map((field) => {
            const isLowConfidence = field.confidence < CONFIDENCE_THRESHOLD
            const isVerified = verifiedState[field.id]

            return (
              <div
                key={field.id}
                className={`relative rounded-xl border p-4 transition-colors ${
                  isVerified
                    ? 'border-[var(--color-sage)]/30 bg-[var(--color-sage)]/5'
                    : isLowConfidence
                    ? 'border-[var(--color-marigold)] bg-[var(--color-marigold)]/5'
                    : 'border-line bg-surface'
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <label className="text-sm font-medium text-pine">
                      {field.name}
                    </label>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-ink-muted">
                        Ref: {field.referenceRange} {field.unit}
                      </span>
                      {field.isCritical && (
                        <span className="inline-flex items-center gap-1 rounded bg-[var(--color-clay)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-clay)] uppercase">
                          Out of range
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        isLowConfidence
                          ? 'text-[var(--color-marigold)]'
                          : 'text-[var(--color-sage)]'
                      }`}
                    >
                      {isLowConfidence ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                      {Math.round(field.confidence * 100)}% Match
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={field.extractedValue}
                    onChange={(e) => handleValueChange(field.id, e.target.value)}
                    className="w-full rounded-lg border border-line bg-panel px-3 py-2 font-data text-sm font-medium focus:border-pine outline-none"
                  />
                  <span className="text-sm text-ink-muted w-16">{field.unit}</span>
                </div>

                <label className="mt-4 flex cursor-pointer items-center gap-2 border-t border-line pt-3">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                      isVerified
                        ? 'border-[var(--color-sage)] bg-[var(--color-sage)] text-surface'
                        : 'border-line bg-panel hover:border-pine'
                    }`}
                  >
                    {isVerified && <Check size={14} strokeWidth={3} />}
                  </div>
                  <input
                    type="checkbox"
                    checked={isVerified || false}
                    onChange={() => toggleVerification(field.id)}
                    className="sr-only"
                  />
                  <span
                    className={`text-sm font-medium ${
                      isVerified ? 'text-[var(--color-sage)]' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    Verified correct
                  </span>
                </label>
              </div>
            )
          })}
        </div>

        {/* Footer actions */}
        <div className="border-t border-line bg-pine-wash/30 p-6">
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-surface p-3 text-sm text-ink-muted shadow-sm border border-line">
            <Info size={16} className="mt-0.5 flex-shrink-0 text-pine" />
            <p>
              Nothing enters the patient record without this signature. You are taking clinical responsibility for these values.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-[var(--color-clay)] hover:text-[var(--color-clay)]">
              Flag unreadable
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allVerified}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pine px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Submit to record
              {!allVerified && (
                <span className="font-data text-[10px] opacity-70">
                  ({Object.values(verifiedState).filter(Boolean).length}/{fields.length})
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
