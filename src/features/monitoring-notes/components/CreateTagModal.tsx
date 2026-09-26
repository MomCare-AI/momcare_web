"use client";

import { useState } from "react";
import { AlertCircle, Check, Tag as TagIcon } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import { useCreateClinicalTag } from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import type { TagSpec } from "@/features/monitoring-notes/types";
import { Modal } from "@/shared/ui/Modal";

const PRESET_COLORS = ["#4361ee", "#1f9254", "#f0972b", "#c0392b", "#31b6d6"];

interface Props {
  open: boolean;
  onClose: () => void;
  /** This patient's own location id — a real tag is scoped here rather
   *  than org-wide, matching the user's ask for "a tag for this specific
   *  [patient's site]". Falls back to an org-wide tag if unavailable (e.g.
   *  the patient has no resolvable location). */
  patientLocationId?: string;
  onCreated: (tag: TagSpec) => void;
}

/**
 * "Add Tag" as a real popup instead of a plain text box.
 *
 * `POST /api/clinical-tags/` (curating the catalogue directly) is
 * hospital_admin only — most staff logging a note are not admins, so this
 * can't always create the tag immediately. For an admin it does: the tag is
 * created for real, right now, and reusable on every future note. For
 * anyone else it stages a `{name, color}` draft instead, resolved the same
 * way a typed-inline tag already was (`services.get_or_create_tags`, via
 * the combined monitoring endpoint) — same ad-hoc creation MomCare has
 * always allowed any staff member to do, just presented through this popup
 * rather than a bare input. Both paths end with the same visible outcome on
 * the note; only *when* the tag becomes a real catalogue row differs.
 */
export function CreateTagModal({
  open,
  onClose,
  patientLocationId,
  onCreated,
}: Props) {
  const { org, isHospitalAdmin } = usePortal();
  const createTag = useCreateClinicalTag();

  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName("");
      setColor(PRESET_COLORS[0]);
      setError(null);
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!isHospitalAdmin) {
      onCreated({ name: trimmed, color });
      onClose();
      return;
    }

    try {
      const tag = await createTag.mutateAsync(
        patientLocationId
          ? { name: trimmed, color, location: patientLocationId }
          : { name: trimmed, color, organization: org.id }
      );
      onCreated({ id: tag.id });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this tag.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add tag"
      subtitle={
        isHospitalAdmin
          ? "Added to your hospital's tag catalogue immediately"
          : "Added to this note when you save it"
      }
      icon={<TagIcon size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
          <label className="mc-label" htmlFor="new-tag-name">
            Tag name <span className="mc-req">*</span>
          </label>
          <input
            id="new-tag-name"
            className="mc-input"
            required
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Follow-up, Motion"
          />
        </div>

        <div>
          <label className="mc-label">Color</label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            {PRESET_COLORS.map((c) => {
              const selected = color.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  aria-pressed={selected}
                  onClick={() => setColor(c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: c,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: selected
                      ? `0 0 0 2px var(--c-card), 0 0 0 4px ${c}`
                      : "none",
                  }}
                >
                  {selected && (
                    <Check size={13} strokeWidth={3} color="#fff" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {!isHospitalAdmin && (
          <p className="mc-hint" style={{ marginTop: 14 }}>
            Only a hospital admin can add to the shared catalogue directly —
            this tag will still be created, just when this note is saved.
          </p>
        )}

        {error && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 16 }}>
            <AlertCircle size={15} strokeWidth={2} aria-hidden />
            {error}
          </p>
        )}

        <div
          style={{
            background: "var(--c-teal-wash)",
            margin: "20px -20px -20px",
            padding: "14px 20px",
            borderTop: "1px solid var(--c-border-soft)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            type="button"
            className="mc-btn-ghost"
            style={{ marginLeft: "auto" }}
            onClick={onClose}
            disabled={createTag.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="mc-btn"
            disabled={createTag.isPending || !name.trim()}
          >
            {createTag.isPending ? "Adding…" : "Add tag"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
