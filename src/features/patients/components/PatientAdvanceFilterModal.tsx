"use client";

import { useState } from "react";
import { Filter, Plus, X } from "lucide-react";

import { Modal } from "@/shared/ui/Modal";
import { Select } from "@/shared/ui/Select";

export type FilterField =
  | "full_name"
  | "case_manager"
  | "provider"
  | "language"
  | "monitoring_status"
  | "reading_days"
  | "last_activity"
  | "risk_level"
  | "patient_status";

export type FilterCondition =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than";

export interface FilterRule {
  id: string;
  field: FilterField;
  condition: FilterCondition;
  value: string;
}

export const FIELD_LABELS: Record<FilterField, string> = {
  full_name: "Patient Name",
  case_manager: "Case Manager",
  provider: "Provider",
  language: "Language",
  monitoring_status: "Monitoring Status",
  reading_days: "Reading Days",
  last_activity: "Last Activity",
  risk_level: "Risk Level",
  patient_status: "Patient Status",
};

/** Fields with no MomCare data yet (`/api/patients/` carries no care-team
 *  names, no language, no reading-day count, no last-activity date) — kept
 *  in the field list to match the reference platform's own filter builder,
 *  but a search against one of these will honestly find nothing, the same
 *  way the matching table columns show "—" rather than a fabricated value,
 *  not silently succeed or lie about a match. */
export const FIELDS_WITHOUT_DATA = new Set<FilterField>([
  "case_manager",
  "provider",
  "language",
  "reading_days",
  "last_activity",
]);

const CONDITION_LABELS: Record<FilterCondition, string> = {
  equals: "equals",
  not_equals: "not equals",
  contains: "contains",
  not_contains: "not contains",
  greater_than: "greater than",
  less_than: "less than",
};

export function describeRule(rule: FilterRule): string {
  return `${FIELD_LABELS[rule.field]} ${CONDITION_LABELS[rule.condition]} "${rule.value}"`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  activeFilters: FilterRule[];
  onApply: (rules: FilterRule[]) => void;
}

export function PatientAdvanceFilterModal({
  open,
  onClose,
  activeFilters,
  onApply,
}: Props) {
  const [draft, setDraft] = useState<FilterRule[]>(activeFilters);
  const [field, setField] = useState<FilterField | "">("");
  const [condition, setCondition] = useState<FilterCondition>("equals");
  const [value, setValue] = useState("");

  // Re-sync the draft from the live filters every time the modal opens —
  // adjusted during render (React's documented alternative to an effect for
  // "reset state when a prop changes"), not in a useEffect, so this doesn't
  // trigger the extra cascading render a setState-in-effect would.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(activeFilters);
      setField("");
      setCondition("equals");
      setValue("");
    }
  }

  const addRule = () => {
    if (!field || !value.trim()) return;
    setDraft((d) => [
      ...d,
      { id: crypto.randomUUID(), field, condition, value: value.trim() },
    ]);
    setField("");
    setCondition("equals");
    setValue("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Advance Filter"
      subtitle="Build precise filters to narrow your patient list"
    >
      <div>
        <label className="mc-label" htmlFor="filter-field">
          FILTER BY
        </label>
        <Select
          id="filter-field"
          aria-label="Filter field"
          value={field}
          onChange={(v) => setField(v as FilterField)}
          placeholder="Select field"
          options={(Object.keys(FIELD_LABELS) as FilterField[]).map((f) => ({
            value: f,
            label: FIELD_LABELS[f],
          }))}
        />
        {field && FIELDS_WITHOUT_DATA.has(field) && (
          <p className="mc-hint" style={{ marginTop: 6 }}>
            No data collected for this field yet — this filter will match
            nothing until it&apos;s wired up.
          </p>
        )}
      </div>

      <div style={{ marginTop: 14 }}>
        <label className="mc-label" htmlFor="filter-condition">
          CONDITION
        </label>
        <Select
          id="filter-condition"
          aria-label="Filter condition"
          value={condition}
          onChange={(v) => setCondition(v as FilterCondition)}
          placeholder="Select condition"
          options={(Object.keys(CONDITION_LABELS) as FilterCondition[]).map(
            (c) => ({ value: c, label: CONDITION_LABELS[c] })
          )}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <label className="mc-label" htmlFor="filter-value">
          VALUE
        </label>
        <input
          id="filter-value"
          className="mc-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter value"
          disabled={!field}
        />
      </div>

      <button
        type="button"
        className="mc-btn-ghost mc-btn-sm"
        style={{ marginTop: 12 }}
        disabled={!field || !value.trim()}
        onClick={addRule}
      >
        <Plus size={13} strokeWidth={2} aria-hidden />
        Add filter
      </button>

      {draft.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 16,
          }}
        >
          {draft.map((rule) => (
            <span
              key={rule.id}
              className="mc-badge mc-badge-neutral"
              style={{ gap: 6 }}
            >
              <Filter size={11} strokeWidth={2.2} aria-hidden />
              {describeRule(rule)}
              <button
                type="button"
                aria-label="Remove filter"
                onClick={() =>
                  setDraft((d) => d.filter((r) => r.id !== rule.id))
                }
                style={{
                  display: "inline-flex",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "inherit",
                }}
              >
                <X size={11} strokeWidth={2.4} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div
        className="mc-card-foot"
        style={{
          padding: "16px 0 0",
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span className="mc-hint">
          {draft.length} filter{draft.length === 1 ? "" : "s"} added
        </span>
        <button
          type="button"
          className="mc-btn-ghost"
          style={{ marginLeft: "auto" }}
          disabled={draft.length === 0}
          onClick={() => setDraft([])}
        >
          Clear All
        </button>
        <button
          type="button"
          className="mc-btn"
          onClick={() => {
            onApply(draft);
            onClose();
          }}
        >
          Apply Filters
        </button>
      </div>
    </Modal>
  );
}
