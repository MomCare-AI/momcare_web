import { Info } from "lucide-react";

import { safeColor, uniqueByName } from "../statusEditing";

export interface StatusPill {
  name: string;
  description: string;
  color: string;
}

/**
 * A patient's statuses as small coloured pills, each with an info marker
 * that carries the status's description. Shown in the patient header and
 * as the list's Statuses column.
 *
 * `layout="inline"` (header): pills sit side by side and wrap; past `max`
 * (default 2) the rest collapse into a "+N" pill whose tooltip names them.
 * `layout="stack"` (list rows): every status is shown, one above the other
 * in thin pills, so a row grows taller the more statuses a patient has.
 */
export function PatientStatusPills({
  statuses,
  max,
  size = "sm",
  layout = "inline",
}: {
  statuses: StatusPill[];
  max?: number;
  size?: "sm" | "md";
  layout?: "inline" | "stack";
}) {
  const stacked = layout === "stack";
  const limit = max ?? (stacked ? Number.POSITIVE_INFINITY : 2);
  const unique = uniqueByName(statuses);
  if (unique.length === 0) return null;

  const shown = unique.slice(0, limit);
  const hidden = unique.slice(limit);
  const fontSize = size === "md" ? 12.5 : 11.5;

  return (
    <span
      style={
        stacked
          ? {
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 3,
            }
          : { display: "inline-flex", flexWrap: "wrap", gap: 4 }
      }
      role="list"
      aria-label="Statuses"
    >
      {shown.map((s) => {
        const color = safeColor(s.color);
        return (
          <span
            key={s.name}
            role="listitem"
            title={s.description || s.name}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: stacked ? "1px 8px" : "2px 8px",
              borderRadius: 999,
              fontSize,
              fontWeight: 600,
              lineHeight: stacked ? 1.4 : 1.5,
              whiteSpace: "nowrap",
              color,
              background: `${color}1a`,
              border: `1px solid ${color}55`,
            }}
          >
            {s.name}
            {s.description && <Info size={11} strokeWidth={2.2} aria-hidden />}
          </span>
        );
      })}
      {hidden.length > 0 && (
        <span
          role="listitem"
          title={hidden.map((s) => s.name).join(", ")}
          style={{
            padding: "2px 8px",
            borderRadius: 999,
            fontSize,
            fontWeight: 600,
            lineHeight: 1.5,
            color: "var(--c-body)",
            background: "var(--c-surface-subtle)",
            border: "1px solid var(--c-border)",
          }}
        >
          +{hidden.length}
        </span>
      )}
    </span>
  );
}
