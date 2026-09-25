"use client";

import { useState } from "react";
import { AlertCircle, FileText } from "lucide-react";

import { useLogContact } from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import { Modal } from "@/shared/ui/Modal";

function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

interface Props {
  patientId: string;
  open: boolean;
  /** Elapsed, not-yet-saved seconds on the header's live timer. */
  seconds: number;
  /** Stay on the page — the modal closes, nothing is saved, the timer
   *  keeps whatever state it already had. */
  onCancel: () => void;
  /** The session was logged (with or without a note) — safe to actually
   *  navigate away now. */
  onDone: () => void;
}

/**
 * Shown when leaving a patient's page with unsaved time still on the live
 * timer — "log this before you go, or explicitly skip it," rather than
 * silently losing it or forcing a save. Matches the reference platform's
 * own exit prompt, minus its Program RPM/CCM toggle (no MomCare concept —
 * same standing drop as `LogSessionModal`).
 */
export function ExitNoteModal({
  patientId,
  open,
  seconds,
  onCancel,
  onDone,
}: Props) {
  const logContact = useLogContact(patientId);
  const [note, setNote] = useState("");
  const [leftVoicemail, setLeftVoicemail] = useState(false);
  const [twoWayCommunication, setTwoWayCommunication] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setNote("");
      setLeftVoicemail(false);
      setTwoWayCommunication(false);
      setError(null);
    }
  }

  const save = async (withNote: boolean) => {
    setError(null);
    const noteText = withNote ? note.trim() : "";
    if (withNote && (leftVoicemail || twoWayCommunication) && !noteText) {
      setError("Recording a call outcome needs a note.");
      return;
    }
    try {
      await logContact.mutateAsync({
        duration_seconds: seconds || null,
        note: noteText,
        left_voicemail: withNote && leftVoicemail,
        two_way_communication: withNote && twoWayCommunication,
      });
      onDone();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not log this session."
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Add Note"
      subtitle="Log a quick note before switching patients"
      icon={<FileText size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <div className="mc-label" style={{ margin: 0 }}>
            Note
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--c-teal)",
            }}
          >
            Live: {formatClock(seconds)}
          </span>
        </div>
        <textarea
          className="mc-input"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was discussed or found — optional"
        />
      </div>

      <div style={{ display: "flex", gap: 18 }}>
        <label style={{ display: "flex", gap: 6, fontSize: 13.5 }}>
          <input
            type="checkbox"
            checked={twoWayCommunication}
            onChange={(e) => {
              setTwoWayCommunication(e.target.checked);
              if (e.target.checked) setLeftVoicemail(false);
            }}
          />
          Two-Way Communication
        </label>
        <label style={{ display: "flex", gap: 6, fontSize: 13.5 }}>
          <input
            type="checkbox"
            checked={leftVoicemail}
            onChange={(e) => {
              setLeftVoicemail(e.target.checked);
              if (e.target.checked) setTwoWayCommunication(false);
            }}
          />
          Voicemail
        </label>
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
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        <button
          type="button"
          className="mc-btn-ghost"
          onClick={onCancel}
          disabled={logContact.isPending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="mc-btn-ghost"
          onClick={() => save(false)}
          disabled={logContact.isPending}
        >
          Continue Without Note
        </button>
        <button
          type="button"
          className="mc-btn"
          onClick={() => save(true)}
          disabled={logContact.isPending}
        >
          {logContact.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </Modal>
  );
}
