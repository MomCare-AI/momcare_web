"use client";

import { useState } from "react";
import { Check, Pencil, StickyNote, Trash2, X } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { InitialsAvatar } from "@/shared/ui/InitialsAvatar";
import { formatDateTime } from "@/shared/lib/formatDateTime";
import type { TextEntry } from "../types";

/**
 * A short list of text entries a doctor can add to, edit and remove — used for
 * the care team's notes and for medications. The two differ only in the title,
 * in who may write (`canWrite`), and in the plan being editable at all
 * (`editable`, false once finalized).
 *
 * Writing is always one step away: the box to add an entry sits at the top of
 * the card, ready to type in, rather than behind a button.
 *
 * Entry text is plain text; it is never rendered as HTML.
 */
export function CarePlanEntries({
  title,
  subtitle,
  emptyText,
  placeholder,
  entries,
  canWrite,
  editable,
  addLabel,
  busy,
  error,
  onAdd,
  onEdit,
  onRemove,
  onDismissError,
}: {
  title: string;
  subtitle?: string;
  emptyText: string;
  /** What the empty box says, e.g. "Write a note for the care team…". */
  placeholder?: string;
  entries: TextEntry[];
  canWrite: boolean;
  editable: boolean;
  addLabel: string;
  busy: boolean;
  error: string | null;
  onAdd: (text: string, done: () => void) => void;
  onEdit: (id: string, text: string, done: () => void) => void;
  onRemove: (id: string) => void;
  onDismissError: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const mayWrite = canWrite && editable;

  return (
    <Card>
      <CardHeader>
        <div>
          <div className="mc-card-title">
            {title}
            {entries.length > 0 && (
              <span className="mc-tab-count" style={{ marginLeft: 8 }}>
                {entries.length}
              </span>
            )}
          </div>
          {subtitle && <div className="mc-card-sub">{subtitle}</div>}
        </div>
      </CardHeader>
      <CardBody>
        {mayWrite && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = draft.trim();
              if (!text) return;
              onAdd(text, () => setDraft(""));
            }}
            style={{ marginBottom: entries.length > 0 ? 18 : 0 }}
          >
            <textarea
              className="mc-input"
              rows={3}
              maxLength={2000}
              aria-label={addLabel}
              placeholder={placeholder ?? `${addLabel}…`}
              value={draft}
              onChange={(e) => {
                if (error) onDismissError();
                setDraft(e.target.value);
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginTop: 8,
              }}
            >
              <span className="mc-hint" style={{ margin: 0 }}>
                {draft.length > 0
                  ? `${draft.length} / 2000`
                  : "Ctrl + Enter to add"}
              </span>
              <button
                type="submit"
                className="mc-btn mc-btn-sm"
                disabled={busy || !draft.trim()}
              >
                {busy && editingId === null ? "Saving…" : addLabel}
              </button>
            </div>
          </form>
        )}

        {entries.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "18px 0 8px",
              color: "var(--c-faint)",
            }}
          >
            <StickyNote size={22} strokeWidth={1.7} aria-hidden />
            <p className="mc-hint" style={{ margin: 0 }}>
              {emptyText}
            </p>
          </div>
        ) : (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {entries.map((entry) => (
              <li
                key={entry.id}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: "var(--r-control)",
                  background: "var(--c-ground)",
                  border: "1px solid var(--c-border-soft)",
                }}
              >
                {entry.added_by && (
                  <InitialsAvatar name={entry.added_by} size={32} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 13, color: "var(--c-faint)" }}>
                      {entry.added_by && (
                        <strong style={{ color: "var(--c-ink)" }}>
                          {entry.added_by}
                        </strong>
                      )}
                      {entry.added_by && " · "}
                      {formatDateTime(entry.created_at)}
                    </div>
                    {mayWrite && editingId !== entry.id && (
                      <span style={{ display: "flex", gap: 4, flex: "none" }}>
                        <button
                          type="button"
                          className="mc-btn-ghost mc-btn-sm"
                          aria-label="Edit"
                          title="Edit"
                          disabled={busy}
                          onClick={() => {
                            onDismissError();
                            setEditingId(entry.id);
                            setEditDraft(entry.text);
                          }}
                        >
                          <Pencil size={12} strokeWidth={2} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="mc-btn-ghost mc-btn-sm"
                          aria-label="Remove"
                          title="Remove"
                          disabled={busy}
                          onClick={() => setRemovingId(entry.id)}
                        >
                          <Trash2 size={12} strokeWidth={2} aria-hidden />
                        </button>
                      </span>
                    )}
                  </div>

                  {editingId === entry.id ? (
                    <form
                      style={{ marginTop: 8 }}
                      onSubmit={(e) => {
                        e.preventDefault();
                        const text = editDraft.trim();
                        if (!text) return;
                        onEdit(entry.id, text, () => setEditingId(null));
                      }}
                    >
                      <textarea
                        className="mc-input"
                        rows={3}
                        maxLength={2000}
                        aria-label="Edit text"
                        autoFocus
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                      />
                      <div className="mc-actions" style={{ marginTop: 8 }}>
                        <button
                          type="submit"
                          className="mc-btn mc-btn-sm"
                          disabled={busy || !editDraft.trim()}
                        >
                          <Check size={13} strokeWidth={2} aria-hidden />
                          Save
                        </button>
                        <button
                          type="button"
                          className="mc-btn-ghost mc-btn-sm"
                          disabled={busy}
                          onClick={() => setEditingId(null)}
                        >
                          <X size={13} strokeWidth={2} aria-hidden />
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 14,
                        lineHeight: 1.5,
                        color: "var(--c-ink)",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {entry.text}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p
            className="mc-alert mc-alert-error"
            role="alert"
            style={{ marginTop: 10 }}
          >
            {error}
          </p>
        )}
      </CardBody>
      <ConfirmDialog
        open={removingId !== null}
        title="Remove this entry?"
        message="It will be taken off this care plan."
        confirmLabel="Remove"
        busy={busy}
        onClose={() => setRemovingId(null)}
        onConfirm={() => {
          if (removingId) onRemove(removingId);
          setRemovingId(null);
        }}
      />
    </Card>
  );
}
