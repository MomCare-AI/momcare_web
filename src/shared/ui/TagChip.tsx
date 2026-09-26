"use client";

import { Check } from "lucide-react";

/** A toggleable tag pill with an unmistakable selected state — filled
 *  background + checkmark + a quick pop, animated so toggling reads as a
 *  real state change rather than a near-invisible border color swap. */
export function TagChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 12px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
        border: active
          ? "1.5px solid var(--c-teal)"
          : "1.5px solid var(--c-border)",
        background: active ? "var(--c-teal)" : "var(--c-ground)",
        color: active ? "#fff" : "var(--c-body)",
        transform: active ? "scale(1.05)" : "scale(1)",
        transition:
          "background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      {active && <Check size={12} strokeWidth={3} aria-hidden />}
      {label}
    </button>
  );
}
