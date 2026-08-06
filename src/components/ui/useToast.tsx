'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  title: string
  description?: string
  type: ToastType
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...options, id }])

    // Auto dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex w-80 animate-in slide-in-from-bottom-5 items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-lg"
          >
            {t.type === 'success' && <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--color-sage)]" size={18} />}
            {t.type === 'error' && <XCircle className="mt-0.5 shrink-0 text-[var(--color-clay)]" size={18} />}
            {t.type === 'info' && <Info className="mt-0.5 shrink-0 text-pine" size={18} />}
            
            <div className="flex-1">
              <p className="text-sm font-semibold text-pine">{t.title}</p>
              {t.description && <p className="mt-1 text-xs text-ink-muted">{t.description}</p>}
            </div>
            
            <button onClick={() => removeToast(t.id)} className="shrink-0 text-ink-muted hover:text-pine">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
