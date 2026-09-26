"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { useUpdateSession } from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import type { MonitoringSession } from "@/features/monitoring-notes/types";
import { formatDateTime } from "@/shared/lib/formatDateTime";
import { Modal } from "@/shared/ui/Modal";

interface Props {
  patientId: string;
  session: MonitoringSession;
  open: boolean;
  onClose: () => void;
}

/** "Edit session" — a real popup instead of an inline expand. Single
 *  duration field, not the reference's RPM/CCM duration split: MomCare's
 *  `MonitoringSession` carries one `duration_seconds` column, no programme
 *  breakdown to edit separately. */
export function SessionEditModal({ patientId, session, open, onClose }: Props) {
  const update = useUpdateSession(patientId);

  const totalSeconds = () => session.duration_seconds;
  const [hours, setHours] = useState(String(Math.floor(totalSeconds() / 3600)));
  const [minutes, setMinutes] = useState(
    String(Math.floor((totalSeconds() % 3600) / 60))
  );
  const [seconds, setSeconds] = useState(String(totalSeconds() % 60));

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setHours(String(Math.floor(totalSeconds() / 3600)));
      setMinutes(String(Math.floor((totalSeconds() % 3600) / 60)));
      setSeconds(String(totalSeconds() % 60));
    }
  }

  const newTotal =
    (Number(hours) || 0) * 3600 +
    (Number(minutes) || 0) * 60 +
    (Number(seconds) || 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTotal <= 0) return;
    update.mutate(
      { sessionId: session.id, input: { duration_seconds: newTotal } },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit session"
      subtitle={formatDateTime(session.recorded_at)}
      icon={<Pencil size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
          <div className="mc-label">Staff</div>
          <input
            className="mc-input"
            value={session.added_by_name}
            disabled
            style={{ color: "var(--c-teal)" }}
          />
        </div>

        <div className="mc-label">Duration</div>
        <div style={{ display: "flex", gap: 10 }}>
          {(
            [
              ["Hours", hours, setHours],
              ["Minutes", minutes, setMinutes],
              ["Seconds", seconds, setSeconds],
            ] as const
          ).map(([label, value, setValue]) => (
            <div key={label} style={{ flex: 1 }}>
              <label className="mc-hint">{label}</label>
              <input
                className="mc-input"
                type="number"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={{ textAlign: "center" }}
              />
            </div>
          ))}
        </div>

        {update.isError && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 16 }}>
            {update.error instanceof Error
              ? update.error.message
              : "Could not save this session."}
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
            disabled={update.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="mc-btn"
            disabled={update.isPending || newTotal <= 0}
          >
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
