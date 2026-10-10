"use client";

import { useEffect } from "react";

/**
 * Shown when a page inside the dashboard breaks. The sidebar and the session
 * stay in place, so the user can try again or go to another page instead of
 * being thrown out to the public error screen.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mc-card" style={{ maxWidth: 520, margin: "48px auto" }}>
      <div className="mc-card-body" style={{ textAlign: "center" }}>
        <div className="mc-card-title" style={{ marginBottom: 8 }}>
          This page did not load
        </div>
        <p className="mc-hint" style={{ margin: "0 0 18px" }}>
          Nothing was lost. Try again, or open another page from the menu. If it
          keeps happening, note what you were doing and tell your administrator.
        </p>
        <button type="button" className="mc-btn" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
