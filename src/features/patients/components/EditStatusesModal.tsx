"use client";

import { useMemo, useState } from "react";
import { Check, Lock, Plus } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/portal";
import { Skeleton } from "@/components/ui/skeleton";
import { useStatusLabels } from "@/features/statuses/hooks/useStatuses";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Modal } from "@/shared/ui/Modal";

import {
  useAddPatientStatus,
  usePatientStatuses,
  useRemovePatientStatus,
} from "../hooks/usePatients";
import {
  buildChoices,
  keyOf,
  planChanges,
  type StatusChoice,
} from "../statusEditing";

/** Colours offered for a new status: the portal's own brand and risk hues. */
const PALETTE: { name: string; hex: string }[] = [
  { name: "Green", hex: "#2f8a72" },
  { name: "Blue", hex: "#4361ee" },
  { name: "Cyan", hex: "#2b8fb0" },
  { name: "Amber", hex: "#c98a2e" },
  { name: "Orange", hex: "#e08a00" },
  { name: "Red", hex: "#d65f58" },
  { name: "Purple", hex: "#7a5fb0" },
  { name: "Grey", hex: "#6b7280" },
];
const NAME_MAX = 100;
const DESCRIPTION_MAX = 255;

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

/**
 * Pick which statuses apply to this patient. Ticking adds one, unticking
 * takes it off, and nothing happens until Save. A status someone else added
 * is locked unless you are a hospital admin, because the server only lets
 * its author (or an admin) remove it.
 *
 * Any staff member (doctor, care manager, nurse) can also create a new,
 * custom status here for this patient. It is free text on the patient, not an
 * entry in the hospital's shared list: that list is curated by hospital
 * admins, while a status logged on a patient is open to all staff.
 */
export function EditStatusesModal({
  open,
  onClose,
  patientId,
  patientName,
}: Props) {
  const { user, isHospitalAdmin } = usePortal();
  const labelsQuery = useStatusLabels();
  const statusesQuery = usePatientStatuses(patientId);
  const addStatus = useAddPatientStatus(patientId);
  const removeStatus = useRemovePatientStatus(patientId);

  // Only what the user has changed; everything else follows the server.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Statuses typed into the "New status" form, not saved until Save.
  const [drafts, setDrafts] = useState<StatusChoice[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0].hex);
  const [newDescription, setNewDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const serverChoices = useMemo(
    () =>
      buildChoices(labelsQuery.data?.results ?? [], statusesQuery.data ?? [], {
        id: user.id,
        isAdmin: isHospitalAdmin,
      }),
    [labelsQuery.data, statusesQuery.data, user.id, isHospitalAdmin]
  );
  const choices = useMemo(
    () => [...serverChoices, ...drafts],
    [serverChoices, drafts]
  );

  const selectedKeys = useMemo(
    () =>
      new Set(
        choices
          .filter(
            (c) =>
              (overrides[c.key] ?? (c.assigned || c.isNew === true)) === true
          )
          .map((c) => c.key)
      ),
    [choices, overrides]
  );
  const plan = useMemo(
    () => planChanges(choices, selectedKeys),
    [choices, selectedKeys]
  );
  const changeCount = plan.toAdd.length + plan.toRemove.length;

  const loading = labelsQuery.isPending || statusesQuery.isPending;

  const resetForm = () => {
    setFormOpen(false);
    setNewName("");
    setNewColor(PALETTE[0].hex);
    setNewDescription("");
    setFormError(null);
  };

  const close = () => {
    setOverrides({});
    setDrafts([]);
    resetForm();
    setError(null);
    onClose();
  };

  const toggle = (choice: StatusChoice, current: boolean) => {
    // A draft that was never saved simply goes away when unticked.
    if (choice.isNew && current) {
      setDrafts((d) => d.filter((x) => x.key !== choice.key));
      return;
    }
    setOverrides((o) => ({ ...o, [choice.key]: !current }));
  };

  const addDraft = () => {
    const name = newName.trim();
    if (!name) {
      setFormError("Give the status a name.");
      return;
    }
    const key = keyOf(name);
    // Already listed (or already typed): just tick it rather than duplicate.
    if (choices.some((c) => c.key === key)) {
      setOverrides((o) => ({ ...o, [key]: true }));
      resetForm();
      return;
    }
    setDrafts((d) => [
      ...d,
      {
        key,
        name,
        // The server requires a description; fall back to the name.
        description: newDescription.trim() || name,
        color: newColor,
        entries: [],
        assigned: false,
        removable: true,
        inCatalogue: false,
        isNew: true,
      },
    ]);
    resetForm();
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const failed: string[] = [];

    for (const c of plan.toAdd) {
      try {
        await addStatus.mutateAsync({
          name: c.name,
          description: c.description,
          color: c.color,
        });
      } catch {
        failed.push(`add "${c.name}"`);
      }
    }
    for (const e of plan.toRemove) {
      try {
        await removeStatus.mutateAsync(e.id);
      } catch {
        failed.push(`remove "${e.name}"`);
      }
    }

    setSaving(false);
    if (failed.length === 0) {
      close();
    } else {
      setError(
        `Could not ${failed.join(", ")}. Anything else you changed was saved.`
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Edit statuses"
      subtitle={patientName}
    >
      {loading ? (
        <div
          role="status"
          aria-busy="true"
          style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
        >
          <span className="sr-only">Loading statuses…</span>
          {[88, 120, 100, 76, 110].map((w, i) => (
            <Skeleton
              key={i}
              aria-hidden
              className="h-8 rounded-full"
              style={{ width: w }}
            />
          ))}
        </div>
      ) : choices.length === 0 ? (
        <EmptyState
          title="No statuses defined yet"
          text={
            isHospitalAdmin
              ? "Create some under Governance, or add one for this patient below."
              : "Ask your hospital administrator to create some under Governance, or add one for this patient below."
          }
        />
      ) : (
        <>
          <p className="mc-hint" style={{ marginTop: 0, marginBottom: 12 }}>
            Select every status that applies. Changes are saved when you press
            Save.
          </p>
          <div
            role="group"
            aria-label="Statuses"
            style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
          >
            {choices.map((c) => {
              const selected = selectedKeys.has(c.key);
              const locked = c.assigned && !c.removable;
              return (
                <button
                  key={c.key}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  disabled={locked || saving}
                  onClick={() => toggle(c, selected)}
                  title={
                    locked
                      ? "Added by someone else. Only they or a hospital admin can remove it."
                      : c.description || c.name
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: locked ? "not-allowed" : "pointer",
                    opacity: locked ? 0.7 : 1,
                    color: selected ? c.color : "var(--c-body)",
                    background: selected ? `${c.color}1a` : "var(--c-card)",
                    border: `1.5px solid ${selected ? c.color : "var(--c-border-control)"}`,
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  {selected ? (
                    <Check size={13} strokeWidth={2.6} aria-hidden />
                  ) : (
                    <span
                      aria-hidden
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: c.color,
                      }}
                    />
                  )}
                  {c.name}
                  {c.isNew && (
                    <span
                      style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.75 }}
                    >
                      NEW
                    </span>
                  )}
                  {locked && <Lock size={11} strokeWidth={2.2} aria-hidden />}
                </button>
              );
            })}
          </div>
        </>
      )}

      {!loading && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid var(--c-border-soft)",
          }}
        >
          {!formOpen ? (
            <button
              type="button"
              className="mc-btn-ghost mc-btn-sm"
              onClick={() => setFormOpen(true)}
              disabled={saving}
            >
              <Plus size={13} strokeWidth={2.2} aria-hidden />
              New status
            </button>
          ) : (
            <div role="group" aria-label="New status">
              <label className="mc-label" htmlFor="new-status-name">
                Name <span aria-hidden>*</span>
              </label>
              <input
                id="new-status-name"
                className="mc-input"
                value={newName}
                maxLength={NAME_MAX}
                autoFocus
                placeholder="e.g. Awaiting labs"
                onChange={(e) => {
                  setNewName(e.target.value);
                  setFormError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDraft();
                  }
                }}
              />

              <div
                role="radiogroup"
                aria-label="Colour"
                style={{ display: "flex", gap: 8, margin: "12px 0" }}
              >
                {PALETTE.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    role="radio"
                    aria-checked={newColor === c.hex}
                    aria-label={c.name}
                    title={c.name}
                    onClick={() => setNewColor(c.hex)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: c.hex,
                      cursor: "pointer",
                      border: "2px solid var(--c-card)",
                      boxShadow:
                        newColor === c.hex
                          ? `0 0 0 2px ${c.hex}`
                          : "0 0 0 1px var(--c-border-control)",
                    }}
                  />
                ))}
              </div>

              <label className="mc-label" htmlFor="new-status-description">
                Description{" "}
                <span className="mc-hint" style={{ display: "inline" }}>
                  (optional)
                </span>
              </label>
              <input
                id="new-status-description"
                className="mc-input"
                value={newDescription}
                maxLength={DESCRIPTION_MAX}
                placeholder="Shown when someone hovers over the status"
                onChange={(e) => setNewDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDraft();
                  }
                }}
              />
              <span className="mc-hint">
                Created for this patient only. Your hospital&rsquo;s preset list
                is managed by an administrator.
              </span>

              {formError && (
                <p
                  className="mc-alert mc-alert-error"
                  role="alert"
                  style={{ marginTop: 10 }}
                >
                  {formError}
                </p>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  className="mc-btn mc-btn-sm"
                  onClick={addDraft}
                >
                  Add status
                </button>
                <button
                  type="button"
                  className="mc-btn-ghost mc-btn-sm"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p
          className="mc-alert mc-alert-error"
          role="alert"
          style={{ marginTop: 14 }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginTop: 20,
        }}
      >
        <span className="mc-hint" style={{ margin: 0 }} aria-live="polite">
          {changeCount === 0
            ? "No changes"
            : `${changeCount} change${changeCount === 1 ? "" : "s"}`}
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="mc-btn-ghost" onClick={close}>
            Cancel
          </button>
          <button
            type="button"
            className="mc-btn"
            disabled={saving || loading || changeCount === 0}
            onClick={save}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
