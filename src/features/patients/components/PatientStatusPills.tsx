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
 * as the list's Statuses column. Past `max`, the rest collapse into a
 * "+N" pill whose tooltip names them, so a patient with many statuses never
 * stretches a table row.
 */
export function PatientStatusPills({
  statuses,
  max = 2,
  size = "sm",
}: {
  statuses: StatusPill[];
  max?: number;
  size?: "sm" | "md";
}) {
  const unique = uniqueByName(statuses);
  if (unique.length === 0) return null;

  const shown = unique.slice(0, max);
  const hidden = unique.slice(max);
  const fontSize = size === "md" ? 12.5 : 11.5;

  return (
    <span
      style={{ display: "inline-flex", flexWrap: "wrap", gap: 4 }}
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
              padding: "2px 8px",
              borderRadius: 999,
              fontSize,
              fontWeight: 600,
              lineHeight: 1.5,
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
