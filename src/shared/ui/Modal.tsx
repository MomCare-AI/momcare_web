"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * A centered dialog with backdrop, Escape-to-close, and focus handling —
 * generalized from MobileSidebarDrawer's off-canvas panel for centered
 * content instead of a side drawer. First use: editing the hospital's own
 * record from the System Governance stats header.
 */
export function Modal({ open, onClose, title, subtitle, children }: Props) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement;
    panelRef.current
      ?.querySelector<HTMLElement>("input,select,textarea,button")
      ?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="mc-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <div className="mc-modal-wrap" role="presentation">
            <motion.div
              ref={panelRef}
              className="mc-modal-panel"
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
              }
            >
              <div className="mc-modal-head">
                <div>
                  <div className="mc-card-title">{title}</div>
                  {subtitle && <div className="mc-card-sub">{subtitle}</div>}
                </div>
                <button
                  type="button"
                  className="mc-btn-ghost mc-btn-sm mc-modal-close"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X size={16} strokeWidth={2} aria-hidden />
                </button>
              </div>
              <div className="mc-modal-body">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
