"use client";

import type { ReactNode } from "react";

/** A small round tinted icon button — teal wash for a neutral/edit action,
 *  red-soft for a destructive one. Shared by every note/session row action
 *  across the app (Clinical Notes tab, Recent Notes card) so they read as
 *  one consistent affordance. */
export function TintedIconButton({
  icon,
  tone,
  label,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  tone: "brand" | "danger";
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "grid",
        placeItems: "center",
        width: 30,
        height: 30,
        borderRadius: "var(--r-control)",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        color: tone === "danger" ? "var(--c-high-text)" : "var(--c-teal)",
        background:
          tone === "danger" ? "var(--c-high-soft)" : "var(--c-teal-wash)",
        opacity: disabled ? 0.6 : 1,
        flexShrink: 0,
      }}
    >
      {icon}
    </button>
  );
}
