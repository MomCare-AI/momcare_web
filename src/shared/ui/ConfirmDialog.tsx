"use client";

import { Modal } from "./Modal";

/**
 * "Are you sure?" for an action that cannot be taken back with one click.
 * Built on the shared Modal so it looks like every other popup.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Remove",
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p style={{ margin: "0 0 18px", fontSize: 14, lineHeight: 1.5 }}>
        {message}
      </p>
      <div
        style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
        role="group"
      >
        <button
          type="button"
          className="mc-btn-ghost"
          disabled={busy}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="mc-btn-dark"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
