import { Info } from "lucide-react";

/** Shown on every Platform Admin screen until the platform-admin API exists. */
export function PreviewNotice() {
  return (
    <div className="mc-alert mc-alert-notice" style={{ marginBottom: 18 }}>
      <Info size={16} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
      <span>
        Preview: this screen uses sample data and is not connected to the
        platform yet. Decisions are not saved and no one is emailed.
      </span>
    </div>
  );
}
