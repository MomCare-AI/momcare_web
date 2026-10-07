"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

import { Modal } from "@/shared/ui/Modal";
import type { AdjustmentInput, PlanItem } from "../types";

type Content = NonNullable<AdjustmentInput["content"]>;

const SLOTS = ["breakfast", "snack", "lunch", "dinner"];

/**
 * Add or edit one nutrition / exercise item. Which fields appear follows the
 * list: meals have a slot, exercise activities have minutes, times a week and
 * an intensity, everything else is just text.
 */
export function PlanItemEditor({
  open,
  onClose,
  title,
  listName,
  initial,
  saving,
  error,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  listName: string;
  initial?: PlanItem;
  saving: boolean;
  error: string | null;
  onSave: (content: Content) => void;
}) {
  const [text, setText] = useState(initial?.text ?? "");
  const [slot, setSlot] = useState(initial?.slot ?? "breakfast");
  const [minutes, setMinutes] = useState(
    initial?.duration_minutes?.toString() ?? ""
  );
  const [perWeek, setPerWeek] = useState(
    initial?.frequency_per_week?.toString() ?? ""
  );
  const [intensity, setIntensity] = useState<"light" | "moderate">(
    initial?.intensity ?? "light"
  );
  const [formError, setFormError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setFormError("Write the item's text first.");
      return;
    }
    setFormError(null);
    const content: Content = { text: trimmed };
    if (listName === "meals") content.slot = slot;
    if (listName === "activities") {
      if (minutes) content.duration_minutes = Number(minutes);
      if (perWeek) content.frequency_per_week = Number(perWeek);
      content.intensity = intensity;
    }
    onSave(content);
  };

  const shown = formError ?? error;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={submit}>
        <div className="mc-formgrid">
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="mc-label" htmlFor="plan-item-text">
              Text
            </label>
            <textarea
              id="plan-item-text"
              className="mc-input"
              rows={3}
              maxLength={300}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {listName === "meals" && (
            <div>
              <label className="mc-label" htmlFor="plan-item-slot">
                Meal
              </label>
              <select
                id="plan-item-slot"
                className="mc-input"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
              >
                {SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {listName === "activities" && (
            <>
              <div>
                <label className="mc-label" htmlFor="plan-item-minutes">
                  Minutes
                </label>
                <input
                  id="plan-item-minutes"
                  className="mc-input"
                  type="number"
                  min={1}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
              </div>
              <div>
                <label className="mc-label" htmlFor="plan-item-perweek">
                  Times a week
                </label>
                <input
                  id="plan-item-perweek"
                  className="mc-input"
                  type="number"
                  min={1}
                  max={7}
                  value={perWeek}
                  onChange={(e) => setPerWeek(e.target.value)}
                />
              </div>
              <div>
                <label className="mc-label" htmlFor="plan-item-intensity">
                  Intensity
                </label>
                <select
                  id="plan-item-intensity"
                  className="mc-input"
                  value={intensity}
                  onChange={(e) =>
                    setIntensity(e.target.value as "light" | "moderate")
                  }
                >
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                </select>
              </div>
            </>
          )}
        </div>

        {shown && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
            <AlertCircle size={14} strokeWidth={2} aria-hidden />
            {shown}
          </p>
        )}

        <div className="mc-actions" style={{ marginTop: 16 }}>
          <button type="submit" className="mc-btn" disabled={saving}>
            {saving ? "Saving…" : "Save"}
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
