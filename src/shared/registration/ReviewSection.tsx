"use client";

export interface ReviewItem {
  label: string;
  value: string | null | undefined;
  wide?: boolean;
}

/** A titled block of label/value pairs with an "Edit" link back to its step. */
export function ReviewSection({
  title,
  items,
  onEdit,
  children,
}: {
  title: string;
  items?: ReviewItem[];
  onEdit?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <section className="hw-review-section" aria-label={title}>
      <div className="hw-review-head">
        <h2 className="hw-review-title">{title}</h2>
        {onEdit && (
          <button type="button" className="hw-review-edit" onClick={onEdit}>
            Edit
          </button>
        )}
      </div>
      {items && (
        <dl className="hw-review-grid">
          {items.map((it) => (
            <div
              key={it.label}
              className={`hw-review-item${it.wide ? " hw-review-wide" : ""}`}
            >
              <dt>{it.label}</dt>
              <dd>{it.value?.trim() ? it.value : "—"}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </section>
  );
}
