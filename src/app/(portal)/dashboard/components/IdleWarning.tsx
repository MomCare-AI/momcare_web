"use client";

import { Clock } from "lucide-react";

import { Modal } from "@/shared/ui/Modal";

/**
 * "Still there?" — shown for the last minute before an inactivity sign-out,
 * so someone reading a chart is never dropped without notice.
 */
export function IdleWarning({
  secondsLeft,
  onStay,
  onSignOut,
}: {
  secondsLeft: number | null;
  onStay: () => void;
  onSignOut: () => void;
}) {
  return (
    <Modal
      open={secondsLeft !== null && secondsLeft > 0}
      onClose={onStay}
      title="Still there?"
      subtitle="You have been inactive for a while"
      icon={<Clock size={17} strokeWidth={2} aria-hidden />}
    >
      <p role="status" aria-live="polite" style={{ marginBottom: 16 }}>
        For your patients&rsquo; privacy you will be signed out in{" "}
        <strong>{secondsLeft ?? 0}</strong> second
        {secondsLeft === 1 ? "" : "s"}.
      </p>
      <div className="mc-actions">
        <button type="button" className="mc-btn" onClick={onStay}>
          Stay signed in
        </button>
        <button type="button" className="mc-btn-ghost" onClick={onSignOut}>
          Sign out now
        </button>
      </div>
    </Modal>
  );
}
