"use client";

import { Trash2 } from "lucide-react";

import { useDeleteNote } from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import type { MonitoringNote } from "@/features/monitoring-notes/types";
import { formatDateTime } from "@/shared/lib/formatDateTime";
import { Modal } from "@/shared/ui/Modal";

interface Props {
  patientId: string;
  note: MonitoringNote;
  open: boolean;
  onClose: () => void;
}

export function NoteDeleteModal({ patientId, note, open, onClose }: Props) {
  const del = useDeleteNote(patientId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete note"
      subtitle="This action can't be undone"
      icon={<Trash2 size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <p className="mc-hint" style={{ margin: 0 }}>
        The note by <strong>{note.added_by_name}</strong> from{" "}
        <strong>{formatDateTime(note.recorded_at)}</strong> will be permanently
        removed from this patient&apos;s record.
      </p>

      {del.isError && (
        <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
          {del.error instanceof Error
            ? del.error.message
            : "Could not delete this note."}
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
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        <button
          type="button"
          className="mc-btn-ghost"
          onClick={onClose}
          disabled={del.isPending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="mc-btn"
          style={{ background: "var(--c-high)" }}
          disabled={del.isPending}
          onClick={() => del.mutate(note.id, { onSuccess: onClose })}
        >
          <Trash2 size={14} strokeWidth={2} aria-hidden />
          {del.isPending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
