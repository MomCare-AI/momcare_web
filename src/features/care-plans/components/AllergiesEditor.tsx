"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

import { Modal } from "@/shared/ui/Modal";
import { CONDITION_FIELDS, DIETARY_OPTIONS } from "../carePlanLogic";
import type { AllergiesAndConditions, AllergiesInput } from "../types";

const NO_CHANGE = "";

/**
 * Edit what the plan is built around. Only fields that actually change are
 * sent, as the server expects.
 *
 * The plan reports which conditions are "yes" but not which of the rest are
 * "no" or "unknown", so a condition is changed by choosing a value explicitly;
 * leaving it on "No change" sends nothing and never turns an unknown into a no.
 *
 * Saving re-plans the week at once, so the response can take 10-20 seconds.
 */
export function AllergiesEditor({
  current,
  saving,
  error,
  onClose,
  onSave,
}: {
  current: AllergiesAndConditions;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: AllergiesInput) => void;
}) {
  const [allergies, setAllergies] = useState(current.food_allergies.join(", "));
  const [diet, setDiet] = useState(current.dietary_preference);
  const [conditions, setConditions] = useState<Record<string, string>>({});

  const yes = new Set(current.conditions.map((c) => c.field));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: AllergiesInput = {};

    const parsed = allergies
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    const same =
      parsed.length === current.food_allergies.length &&
      parsed.every((a, i) => a === current.food_allergies[i]);
    if (!same) input.food_allergies = parsed;

    if (diet !== current.dietary_preference) input.dietary_preference = diet;

    for (const [field, value] of Object.entries(conditions)) {
      if (value !== NO_CHANGE) input[field] = value;
    }

    if (Object.keys(input).length === 0) {
      onClose();
      return;
    }
    onSave(input);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Allergies, diet and conditions"
      subtitle="Saving re-plans this week, which can take up to 20 seconds."
    >
      <form onSubmit={submit}>
        <div className="mc-formgrid">
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="mc-label" htmlFor="cp-allergies">
              Food allergies{" "}
              <span className="mc-hint">(separate with commas)</span>
            </label>
            <input
              id="cp-allergies"
              className="mc-input"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="cp-diet">
              Dietary preference
            </label>
            <select
              id="cp-diet"
              className="mc-input"
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
            >
              {DIETARY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="mc-card-sub"
          style={{ fontWeight: 600, margin: "14px 0 6px" }}
        >
          Conditions
        </div>
        <div className="mc-formgrid">
          {CONDITION_FIELDS.map(({ field, label }) => (
            <div key={field}>
              <label className="mc-label" htmlFor={`cp-${field}`}>
                {label}
                {yes.has(field) && (
                  <span className="mc-hint"> · currently Yes</span>
                )}
              </label>
              <select
                id={`cp-${field}`}
                className="mc-input"
                value={conditions[field] ?? NO_CHANGE}
                onChange={(e) =>
                  setConditions((prev) => ({
                    ...prev,
                    [field]: e.target.value,
                  }))
                }
              >
                <option value={NO_CHANGE}>No change</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          ))}
        </div>

        {error && (
          <p
            className="mc-alert mc-alert-error"
            role="alert"
            style={{ marginTop: 12 }}
          >
            <AlertCircle size={14} strokeWidth={2} aria-hidden />
            {error}
          </p>
        )}

        <div className="mc-actions" style={{ marginTop: 16 }}>
          <button type="submit" className="mc-btn" disabled={saving}>
            {saving ? "Saving and re-planning…" : "Save"}
          </button>
          <button
            type="button"
            className="mc-btn-ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
