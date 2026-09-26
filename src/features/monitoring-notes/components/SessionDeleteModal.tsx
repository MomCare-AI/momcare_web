"use client";

import { Trash2 } from "lucide-react";

import { useDeleteSession } from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import type { MonitoringSession } from "@/features/monitoring-notes/types";
import { formatDateTime } from "@/shared/lib/formatDateTime";
import { Modal } from "@/shared/ui/Modal";

interface Props {
  patientId: string;
  session: MonitoringSession;
  open: boolean;
  onClose: () => void;
}

export function SessionDeleteModal({
  patientId,
  session,
  open,
  onClose,
}: Props) {
  const del = useDeleteSession(patientId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete session"
      subtitle="This action can't be undone"
      icon={<Trash2 size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <p className="mc-hint" style={{ margin: 0 }}>
        The session logged by <strong>{session.added_by_name}</strong> on{" "}
        <strong>{formatDateTime(session.recorded_at)}</strong> will be
        permanently removed from this patient&apos;s monitoring log.
      </p>

      {del.isError && (
        <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
          {del.error instanceof Error
            ? del.error.message
            : "Could not delete this session."}
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
          onClick={() => del.mutate(session.id, { onSuccess: onClose })}
        >
          <Trash2 size={14} strokeWidth={2} aria-hidden />
          {del.isPending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
