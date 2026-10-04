"use client";

import { useMemo, useState } from "react";
import { Check, Lock } from "lucide-react";

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
import { buildChoices, planChanges } from "../statusEditing";

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

/**
 * Pick which of the hospital's statuses apply to this patient. Ticking adds
 * one, unticking takes it off, and nothing happens until Save. A status
 * someone else added is locked unless you are a hospital admin, because the
 * server only lets its author (or an admin) remove it.
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

  const choices = useMemo(
    () =>
      buildChoices(labelsQuery.data?.results ?? [], statusesQuery.data ?? [], {
        id: user.id,
        isAdmin: isHospitalAdmin,
      }),
    [labelsQuery.data, statusesQuery.data, user.id, isHospitalAdmin]
  );

  const selectedKeys = useMemo(
    () =>
      new Set(
        choices
          .filter((c) => (overrides[c.key] ?? c.assigned) === true)
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

  const close = () => {
    setOverrides({});
    setError(null);
    onClose();
  };

  const toggle = (key: string, current: boolean) =>
    setOverrides((o) => ({ ...o, [key]: !current }));

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
              ? "Create some under Governance, then choose them here."
              : "Ask your hospital administrator to create some under Governance."
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
                  onClick={() => toggle(c.key, selected)}
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
                  {locked && <Lock size={11} strokeWidth={2.2} aria-hidden />}
                </button>
              );
            })}
          </div>
        </>
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
