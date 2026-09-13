import type { ReactNode } from "react";

/**
 * The icon/title/text/actions shape repeated at every "nothing to show"
 * point in the portal — empty lists, load failures, not-yet-assessed
 * states. Was copy-pasted identically across ~15 call sites; this is a
 * structural extraction of that exact .mc-empty-* markup, not a redesign.
 *
 * `icon` is intentionally optional: this project's own convention already
 * omits it specifically for error states (see the callers), so an error
 * doesn't visually read as calm as a genuine empty list.
 */
export function EmptyState({
  icon,
  title,
  text,
  actions,
}: {
  icon?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mc-empty">
      {icon && <span className="mc-empty-icon">{icon}</span>}
      <span className="mc-empty-title">{title}</span>
      {text && <span className="mc-empty-text">{text}</span>}
      {actions && <span className="mc-empty-actions">{actions}</span>}
    </div>
  );
}
