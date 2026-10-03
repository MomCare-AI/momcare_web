"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

/**
 * A short confirmation after a decision ("Noor Mother & Child Hospital
 * approved."), so the person knows it went through even when the page
 * underneath changes quietly. Clears itself after a few seconds.
 */
export function useDecisionNotice() {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const clear = useCallback(() => setNotice(null), []);
  return { notice, show: setNotice, clear };
}

export function DecisionNotice({
  message,
  onClose,
}: {
  message: string | null;
  onClose: () => void;
}) {
  if (!message) return null;
  return (
    <div
      className="mc-alert mc-alert-success"
      role="status"
      style={{ marginBottom: 14, alignItems: "center" }}
    >
      <CheckCircle2 size={16} aria-hidden style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="mc-btn-ghost"
        style={{ padding: 4 }}
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}
