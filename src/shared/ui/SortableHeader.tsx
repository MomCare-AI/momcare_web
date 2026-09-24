import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

export type SortDirection = "asc" | "desc" | null;

/**
 * A clickable `<th>` for the dense-table screens (System Governance's
 * Locations/Staff/Secondary Providers) — cycles through ascending → descending → the
 * table's default order, whichever `onClick` decides. Not a header for
 * unsortable columns; those are plain `<th>`s beside these.
 */
export function SortableHeader({
  label,
  direction,
  onClick,
}: {
  label: string;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <th
      aria-sort={
        direction === "asc"
          ? "ascending"
          : direction === "desc"
            ? "descending"
            : "none"
      }
    >
      <button type="button" className="mc-dtable-sort" onClick={onClick}>
        {label}
        {direction === "asc" ? (
          <ChevronUp size={12} strokeWidth={2.5} aria-hidden />
        ) : direction === "desc" ? (
          <ChevronDown size={12} strokeWidth={2.5} aria-hidden />
        ) : (
          <ChevronsUpDown size={12} strokeWidth={2} aria-hidden />
        )}
      </button>
    </th>
  );
}
