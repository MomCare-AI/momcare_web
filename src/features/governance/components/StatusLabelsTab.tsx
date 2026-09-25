"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import {
  useCreateStatusLabel,
  useDeleteStatusLabel,
  useStatusLabels,
  useUpdateStatusLabel,
} from "@/features/statuses/hooks/useStatuses";
import type { StatusLabel } from "@/features/statuses/types";
import { ActionMenu, ActionMenuItem } from "@/shared/ui/ActionMenu";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Modal } from "@/shared/ui/Modal";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

const DEFAULT_COLOR = "#4361ee";
const PRESET_COLORS = ["#1f9254", "#f0972b", "#c0392b", "#31b6d6", "#26333f"];

/**
 * Hospital-invented status vocabulary ("Critical", "Telehealth Connected",
 * "Waiting"...) — a catalogue that powers a picker when logging a status on
 * a patient (`PatientStatusPanel`), not a constraint on what can be logged
 * (`PatientStatus` has no FK back here, matching the reference platform).
 * Added 25 Sep 2026 alongside `ClinicalTag` as a genuinely separate model —
 * `description` here is real and persisted, unlike the disclosed-fake field
 * on the Clinical Tags tab.
 */
export function StatusLabelsTab() {
  const labelsQuery = useStatusLabels();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const labels = labelsQuery.data?.results ?? [];
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? labels.filter((l) => l.name.toLowerCase().includes(q)) : labels;
  }, [labels, search]);

  return (
    <>
      <Card>
        {labelsQuery.isSuccess && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
              padding: "14px 20px 0",
            }}
          >
            <div style={{ position: "relative", maxWidth: 320, flex: 1 }}>
              <Search
                size={14}
                strokeWidth={2}
                aria-hidden
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: 0.5,
                }}
              />
              <input
                className="mc-input"
                style={{ paddingLeft: 30 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search statuses…"
                aria-label="Search statuses"
              />
            </div>

            <button className="mc-btn" onClick={() => setShowCreate(true)}>
              <Plus size={15} strokeWidth={2} aria-hidden />
              Create status
            </button>
          </div>
        )}

        {labelsQuery.isPending && (
          <CardBody>
            <div className="mc-rows">
              <RowSkeleton count={3} variant="plain" />
            </div>
          </CardBody>
        )}

        {labelsQuery.isError && (
          <CardBody>
            <EmptyState
              icon={<Sparkles size={20} strokeWidth={1.9} aria-hidden />}
              title="Couldn't load statuses"
              text="This is a problem reaching the server, not an empty list. Refresh to try again."
            />
          </CardBody>
        )}

        {labelsQuery.isSuccess &&
          (rows.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<Sparkles size={20} strokeWidth={1.9} aria-hidden />}
                title={
                  labels.length === 0 ? "No statuses yet" : "No statuses match"
                }
                text={
                  labels.length === 0
                    ? "Create a status label to power the picker on a patient's record."
                    : "Try a different search term."
                }
              />
            </CardBody>
          ) : (
            <div className="mc-dtable-wrap" style={{ marginTop: 14 }}>
              <table className="mc-dtable">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Description</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((label) => (
                    <tr key={label.id} className="mc-dtable-row">
                      <td>
                        <StatusPill label={label} />
                      </td>
                      <td className="mc-dtable-sub">
                        {label.description || "—"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <StatusActionMenu label={label} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </Card>

      <StatusFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

function StatusPill({ label }: { label: StatusLabel }) {
  const color = label.color ?? DEFAULT_COLOR;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        color,
        background: `${color}1a`,
        border: `1px solid ${color}55`,
      }}
    >
      {label.name}
    </span>
  );
}

function StatusActionMenu({ label }: { label: StatusLabel }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <ActionMenu label="Status actions">
        <ActionMenuItem
          icon={<Pencil size={13} strokeWidth={2} aria-hidden />}
          label="Edit"
          onClick={() => setShowEdit(true)}
        />
        <ActionMenuItem
          icon={<Trash2 size={13} strokeWidth={2} aria-hidden />}
          label="Remove"
          danger
          onClick={() => setShowDelete(true)}
        />
      </ActionMenu>

      <StatusFormModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        label={label}
      />
      <DeleteStatusModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        label={label}
      />
    </div>
  );
}

function StatusFormModal({
  open,
  onClose,
  label,
}: {
  open: boolean;
  onClose: () => void;
  label?: StatusLabel;
}) {
  const { org } = usePortal();
  const createLabel = useCreateStatusLabel();
  const updateLabel = useUpdateStatusLabel();
  const isEdit = !!label;

  const [form, setForm] = useState({
    name: label?.name ?? "",
    description: label?.description ?? "",
    color: label?.color ?? DEFAULT_COLOR,
  });
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm({
        name: label?.name ?? "",
        description: label?.description ?? "",
        color: label?.color ?? DEFAULT_COLOR,
      });
      setError(null);
    }
  }

  const pending = createLabel.isPending || updateLabel.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit) {
        await updateLabel.mutateAsync({
          labelId: label.id,
          input: {
            name: form.name,
            description: form.description,
            color: form.color,
          },
        });
      } else {
        await createLabel.mutateAsync({
          name: form.name,
          description: form.description,
          color: form.color,
          organization: org.id,
        });
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save this status."
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit status" : "Create status"}
      subtitle={
        isEdit
          ? "Update this status's name, description and color"
          : "Define a reusable status for your organization"
      }
      icon={<Sparkles size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
          <label className="mc-label" htmlFor="status-form-name">
            Status Name <span className="mc-req">*</span>
          </label>
          <input
            id="status-form-name"
            className="mc-input"
            required
            maxLength={30}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Critical, Telehealth Connected"
          />
          <div className="mc-hint" style={{ textAlign: "right", marginTop: 4 }}>
            {form.name.length}/30
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="mc-label" htmlFor="status-form-description">
            Description
          </label>
          <textarea
            id="status-form-description"
            className="mc-input"
            rows={3}
            maxLength={200}
            style={{ resize: "vertical" }}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe when this status applies…"
          />
          <div className="mc-hint" style={{ textAlign: "right", marginTop: 4 }}>
            {form.description.length}/200
          </div>
        </div>

        <div>
          <label className="mc-label">
            Color <span className="mc-req">*</span>
          </label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            {PRESET_COLORS.map((c) => {
              const selected = form.color.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  aria-pressed={selected}
                  onClick={() => setForm({ ...form, color: c })}
                  style={{
                    width: 30,
                    height: 30,
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
                    <Check size={14} strokeWidth={3} color="#fff" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        </div>

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
            disabled={pending}
          >
            Cancel
          </button>
          <button type="submit" className="mc-btn" disabled={pending}>
            <Plus size={15} strokeWidth={2} aria-hidden />
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create status"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteStatusModal({
  open,
  onClose,
  label,
}: {
  open: boolean;
  onClose: () => void;
  label: StatusLabel;
}) {
  const deleteLabel = useDeleteStatusLabel();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Remove status"
      subtitle={label.name}
    >
      <p className="mc-hint">
        This removes the status from the catalogue picker. Statuses already
        logged on a patient&apos;s record are unaffected — they carry their own
        name/description/color, not a reference to this entry.
      </p>

      {deleteLabel.isError && (
        <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
          {deleteLabel.error instanceof Error
            ? deleteLabel.error.message
            : "Could not remove this status."}
        </p>
      )}

      <div
        className="mc-card-foot"
        style={{
          padding: "12px 0 0",
          marginTop: 16,
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
          disabled={deleteLabel.isPending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="mc-btn"
          style={{ background: "var(--c-high)" }}
          disabled={deleteLabel.isPending}
          onClick={() => deleteLabel.mutate(label.id, { onSuccess: onClose })}
        >
          {deleteLabel.isPending ? "Removing…" : "Confirm remove"}
        </button>
      </div>
    </Modal>
  );
}
