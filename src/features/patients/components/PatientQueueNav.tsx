"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import type { queuePosition } from "../patientQueue";

type Position = NonNullable<ReturnType<typeof queuePosition>>;

const ARROW = {
  display: "grid",
  placeItems: "center",
  width: 30,
  height: 30,
  borderRadius: 999,
  border: "1px solid var(--c-border)",
  background: "var(--c-card)",
  color: "var(--c-ink)",
  cursor: "pointer",
} as const;

/**
 * "‹ Patient 3 / 25 ›" — steps to the previous or next patient in the list
 * this record was opened from. The arrows are disabled at either end, not
 * wrapped, so a clinician never loops back to a patient she already saw.
 */
export function PatientQueueNav({
  position,
  onGo,
}: {
  position: Position;
  onGo: (patientId: string) => void;
}) {
  return (
    <nav
      aria-label="Patient list navigation"
      style={{ display: "flex", alignItems: "center", gap: 8 }}
    >
      <button
        type="button"
        aria-label="Previous patient"
        disabled={!position.previousId}
        onClick={() => position.previousId && onGo(position.previousId)}
        style={{
          ...ARROW,
          opacity: position.previousId ? 1 : 0.4,
          cursor: position.previousId ? "pointer" : "default",
        }}
      >
        <ChevronLeft size={15} strokeWidth={2.2} aria-hidden />
      </button>
      <span
        aria-live="polite"
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--c-body)",
          padding: "5px 14px",
          borderRadius: 999,
          background: "var(--c-surface-subtle)",
          whiteSpace: "nowrap",
        }}
      >
        Patient {position.position} / {position.total}
      </span>
      <button
        type="button"
        aria-label="Next patient"
        disabled={!position.nextId}
        onClick={() => position.nextId && onGo(position.nextId)}
        style={{
          ...ARROW,
          opacity: position.nextId ? 1 : 0.4,
          cursor: position.nextId ? "pointer" : "default",
        }}
      >
        <ChevronRight size={15} strokeWidth={2.2} aria-hidden />
      </button>
    </nav>
  );
}
