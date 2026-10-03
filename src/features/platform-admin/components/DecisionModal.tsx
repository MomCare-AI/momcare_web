"use client";

import { useState } from "react";

import { Modal } from "@/shared/ui/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Label above the text box, e.g. "Reason". */
  fieldLabel: string;
  hint?: string;
  required: boolean;
  confirmLabel: string;
  danger?: boolean;
  /** Runs the decision; throw to show the message inside the dialog. */
  onConfirm: (text: string) => Promise<unknown>;
}

/**
 * Collects the written reason or note for a decision. A required reason
 * keeps the confirm button disabled until something is typed; the repository
 * (and the real API) enforce the same rule, so this is a convenience only.
 */
export function DecisionModal({
  open,
  onClose,
  title,
  subtitle,
  fieldLabel,
  hint,
  required,
  confirmLabel,
  danger,
  onConfirm,
}: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setText("");
    setError(null);
    onClose();
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(text);
      setText("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title={title} subtitle={subtitle}>
      <label className="mc-label" htmlFor="decision-text">
        {fieldLabel}
        {required && <span aria-hidden> *</span>}
      </label>
      <textarea
        id="decision-text"
        className="mc-input"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
      />
      {hint && <span className="mc-hint">{hint}</span>}

      {error && (
        <div
          className="mc-alert mc-alert-error"
          role="alert"
          style={{ marginTop: 12 }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 18,
        }}
      >
        <button type="button" className="mc-btn-ghost" onClick={close}>
          Cancel
        </button>
        <button
          type="button"
          className="mc-btn"
          style={
            danger
              ? { background: "#b42318", borderColor: "#b42318" }
              : undefined
          }
          disabled={busy || (required && !text.trim())}
          onClick={confirm}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
