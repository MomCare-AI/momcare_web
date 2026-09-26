"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** An icon badge shown before the title — optional, so every existing
   *  caller keeps its current plain header unchanged. */
  icon?: ReactNode;
  /** Tints the header with the brand wash color instead of the plain card
   *  background — optional, defaults to the existing plain look. */
  tinted?: boolean;
  children: ReactNode;
}

/**
 * A centered dialog with backdrop, Escape-to-close, and focus handling —
 * generalized from MobileSidebarDrawer's off-canvas panel for centered
 * content instead of a side drawer. First use: editing the hospital's own
 * record from the System Governance stats header.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  tinted,
  children,
}: Props) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);
  // Callers pass a fresh inline `() => setShow(false)` on every render, so
  // this ref (not the prop itself) is what the effect below reads — keeping
  // `onClose` out of the dependency array below. Without this, any
  // unrelated re-render (a react-query refetch, a sibling state update)
  // reruns the effect and steals focus straight back to the Close button
  // mid-keystroke, which is what made every field in every popup here
  // appear to stop accepting input after one character.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement;
    // Scoped to the body, never the header — the header's own Close button
    // is a `<button>` that sits earlier in DOM order than any body field,
    // so an unscoped query here would always focus it instead of the
    // intended first input.
    bodyRef.current
      ?.querySelector<HTMLElement>("input,select,textarea,button")
      ?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [open]);

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
              <div
                className="mc-modal-head"
                style={
                  tinted ? { background: "var(--c-teal-wash)" } : undefined
                }
              >
                <div
                  style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
                >
                  {icon && (
                    <span
                      aria-hidden
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 38,
                        height: 38,
                        flexShrink: 0,
                        borderRadius: 10,
                        border: "1.5px solid var(--c-teal-soft)",
                        color: "var(--c-teal)",
                        background: "var(--c-teal-wash)",
                      }}
                    >
                      {icon}
                    </span>
                  )}
                  <div>
                    <div className="mc-card-title">{title}</div>
                    {subtitle && <div className="mc-card-sub">{subtitle}</div>}
                  </div>
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
              <div className="mc-modal-body" ref={bodyRef}>
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
